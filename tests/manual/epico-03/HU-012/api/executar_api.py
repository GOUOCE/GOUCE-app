"""Executa os roteiros HU-011/012 por HTTP real e preserva evidência JSON.

Não usa TestClient, mock, dependency_override ou escrita direta em rotas.
DATABASE_URL é usada somente para consultas de persistência/auditoria.
"""
import os, sys, json, re, time, copy, subprocess, urllib.request, urllib.error
from pathlib import Path
from datetime import datetime, timezone
import psycopg2
from psycopg2.extras import RealDictCursor

def now():return datetime.now(timezone.utc).isoformat()
def clean(obj):
    if isinstance(obj,dict):
        return {k:('[REDACTED]' if k.lower() in {'senha','password','token_acesso','token_atualizacao','access_token','refresh_token','email','telefone','nome_completo','nome_usuario'} else clean(v)) for k,v in obj.items()}
    if isinstance(obj,list):return [clean(v) for v in obj]
    return obj
def encode(value):
    if isinstance(value,set):return sorted(value)
    if isinstance(value,datetime):return value.isoformat()
    return str(value)
def write(path,data):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(data,ensure_ascii=False,indent=2,default=encode)+'\n')

class Suite:
    def __init__(self,hu):
        self.hu=hu;self.base=os.environ['QA_BASE_URL'];self.prefix='/rotas-principais' if hu=='011' else '/rotas-complementares'
        self.root=Path(os.environ.get('QA_OUTPUT',f'tests/manual/epico-03/HU-{hu}/api/evidencias'))
        self.run_id=os.environ.get('QA_RUN_ID',datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
        self.env={'base_url':self.base,'branch':subprocess.check_output(['git','branch','--show-current'],text=True).strip(),'application_commit':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'plan_commit':'939921e3','database':'PostgreSQL 15 isolado; migrations reais','transport':'HTTP localhost via urllib.request; sem mocks','python':sys.version.split()[0]}
        self.db=psycopg2.connect(os.environ['DATABASE_URL']);self.db.autocommit=True
        self.tokens={};self.accounts={};self.ids={};self.cases={};self.sequence=0;self.current=None;self.operations=[];self.start=now()
    def case(self,n):
        key='PRECONDICOES' if n==0 else f'CT-HU{self.hu}-API-{n:03d}'
        self.current=self.cases.setdefault(key,{'case_id':key,'run_id':self.run_id,'environment':self.env,'started_at':now(),'checks':[],'requests':[],'database_checks':[],'notes':[],'dependencies':[]})
        return self.current
    def check(self,label,expected,actual,level='failure'):
        ok=expected==actual
        self.current['checks'].append({'description':label,'expected':expected,'actual':actual,'passed':ok,'severity_if_failed':level})
        return ok
    def note(self,message):self.current['notes'].append(message)
    def blocked(self,reason):self.current['dependencies'].append({'status':'BLOCKED','reason':reason})
    def rows(self,sql,params=()):
        with self.db.cursor(cursor_factory=RealDictCursor) as cur:cur.execute(sql,params);return [dict(r) for r in cur.fetchall()]
    def sql(self,label,sql,params=()):
        rows=self.rows(sql,params);self.current['database_checks'].append({'timestamp':now(),'description':label,'sql':sql,'parameters':list(params),'rows':rows});return rows
    def audit(self):return self.rows("SELECT id,usuario_id,acao,entidade,entidade_id,valor_anterior,valor_novo,criado_em FROM log_auditoria WHERE entidade IN ('rota_principal','rota_complementar') ORDER BY id")
    def state(self):
        tables=['rota_principal','rota_principal_bairro','rota_principal_faculdade_ida','rota_principal_faculdade_volta','rota_complementar']
        existing={r['table_name'] for r in self.rows("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")}
        return {t:self.rows('SELECT * FROM '+t+' ORDER BY 1,2') for t in tables if t in existing}
    def request(self,method,path,body=None,role='admin',expected=None,label='',record_mutation=True):
        self.sequence+=1;headers={'Accept':'application/json'}
        if body is not None:headers['Content-Type']='application/json'
        if role in self.tokens:headers['Authorization']='Bearer '+self.tokens[role]
        mutation=record_mutation and method in {'POST','PATCH'} and path.startswith('/rotas-')
        before=self.state() if mutation else None;aud0=self.audit() if mutation else []
        t=time.perf_counter();stamp=now();data=json.dumps(body,ensure_ascii=False).encode() if body is not None else None
        try:
            response=urllib.request.urlopen(urllib.request.Request(self.base+path,data=data,headers=headers,method=method),timeout=20)
        except urllib.error.HTTPError as error:response=error
        with response:
            raw=response.read().decode('utf-8');status=response.status
            try:payload=json.loads(raw)
            except ValueError:payload={'raw_body':raw}
            response_headers={k:v for k,v in response.headers.items() if k.lower() in {'content-type','date','access-control-allow-origin'}}
        request={'sequence':self.sequence,'timestamp':stamp,'label':label,'duration_ms':round((time.perf_counter()-t)*1000,2),'actor':role,'request':{'method':method,'url':self.base+path,'headers':{k:('[REDACTED]' if k=='Authorization' else v) for k,v in headers.items()},'json':clean(body)},'response':{'status':status,'headers':response_headers,'json':clean(payload)}}
        if mutation:
            after=self.state();aud1=self.audit();delta=[r for r in aud1 if r['id'] not in {x['id'] for x in aud0}]
            request['database_before']=before;request['database_after']=after;request['database_unchanged']=before==after;request['audit_delta']=delta
            self.operations.append({'case_id':self.current['case_id'],'sequence':self.sequence,'method':method,'path':path,'status':status,'unchanged':before==after,'audit_delta':delta,'body':body,'response_id':payload.get('data',{}).get('id')})
            if status in {400,401,403,404,409,422}:
                self.check(f'{label or path}: recusa não altera rotas/vínculos',True,before==after)
                self.check(f'{label or path}: recusa sem auditoria',0,len(delta))
        self.current['requests'].append(request)
        if expected is not None:self.check(label or f'{method} {path}: HTTP',expected,status)
        if expected in {401,403,404,409,422} and status==expected:
            self.check('envelope de erro padronizado',{401:'UNAUTHORIZED',403:'FORBIDDEN',404:'RESOURCE_NOT_FOUND',409:'CONFLICT',422:'REQUEST_VALIDATION_ERROR'}[expected],payload.get('error',{}).get('code'))
        return status,payload
    def detail(self,body,field,message=None):
        details=body.get('error',{}).get('details',[])
        self.check('erro identifica '+field,True,any(d.get('field')==field for d in details))
        if message:self.check('mensagem de '+field,True,any(d.get('field')==field and d.get('message')==message for d in details))
    def post(self,payload,note='',expected=201,endpoint=None):return self.request('POST',endpoint or self.prefix,payload,expected=expected,label=note)
    def get(self,rid,endpoint=None):return self.request('GET',(endpoint or self.prefix)+f'/{rid}',expected=200)[1]
    def patch(self,rid,body,expected=200,note='',endpoint=None):return self.request('PATCH',(endpoint or self.prefix)+f'/{rid}',body,expected=expected,label=note)
    def change(self,rid,action,expected=200,endpoint=None):return self.request('PATCH',(endpoint or self.prefix)+f'/{rid}/{action}',expected=expected)
    def success(self,body):
        self.check('success true',True,body.get('success'));self.check('mensagem de sucesso','Operação realizada com sucesso',body.get('message'))
    def principal(self,name='Rota Controle'):
        return {'nome':name,'horario_saida':'06:30','horario_retorno':'17:30','bairros_ids':[self.ids['B1']],'faculdades_ida_ids':[self.ids['F1']],'faculdades_volta_ids':[self.ids['F1']]}
    def complementary(self,name='Van Controle',pid=None):return {'nome':name,'horario_saida':'06:00','ponto_conexao':'Trevo do Bairro Novo','rota_principal_id':pid or self.ids['RP1']}
    def login(self,role,credentials):
        status,b=self.request('POST','/auth/login',credentials,role='none',expected=200,label='login '+role,record_mutation=False)
        if status==200 and b.get('token_acesso'):
            self.tokens[role]=b['token_acesso'];self.accounts[role]=b.get('usuario',{})
            # Mesmo os nomes fictícios de contas não entram nas evidências públicas.
            self.current['requests'][-1]['response']['json'].get('usuario',{}).update({'nome':'[DADO_SINTETICO_OMITIDO]'})
            return True
        return False
    def setup(self):
        self.case(0)
        if not self.login('admin',{'email':os.environ['QA_ADMIN_EMAIL'],'senha':os.environ['QA_ADMIN_PASSWORD']}):raise RuntimeError('Login administrador falhou')
        _,bairros=self.request('GET','/bairros',expected=200)
        for key,name in [('B1','Centro'),('B2','Campo Velho'),('B0','Alto São Francisco')]:
            existing=next((x for x in bairros if x.get('nome')==name),None)
            if existing:
                self.ids[key]=existing.get('bairro_id') or existing.get('id');self.note('Bairro '+name+' reutilizado do seed da migration.');continue
            _,b=self.request('POST','/bairros',{'nome_bairro':name,'pontos_de_parada':['Ponto QA '+key]},expected=201)
            d=b.get('data',b);self.ids[key]=d.get('bairro_id') or d.get('id')
        self.request('PATCH',f"/bairros/{self.ids['B0']}/inativar",expected=200)
        for key,name,sigla,campus in [('F1','UFC','UFC','Campus Quixadá'),('F2','IFCE','IFCE','Quixadá'),('F3','UECE','UECE','Quixadá'),('F0','Unicatólica','UC','Quixadá')]:
            _,b=self.request('POST','/faculdades',{'nome_faculdade':name,'sigla':sigla,'campus_faculdade':campus},expected=201)
            self.ids[key]=b.get('data',b).get('id_faculdade')
        self.request('PATCH',f"/faculdades/{self.ids['F0']}/inativar",expected=200)
        if os.environ.get('QA_SEED_ACCOUNTS'):
            e=dict(os.environ,QA_ACCOUNTS_FILE=os.environ['QA_ACCOUNTS_FILE'])
            r=subprocess.run([sys.executable,os.environ['QA_SEED_ACCOUNTS']],cwd='backend',env=e,text=True,capture_output=True)
            if r.returncode:raise RuntimeError('Seed das contas falhou: '+r.stderr[-2000:])
        fixture=json.loads(Path(os.environ['QA_ACCOUNTS_FILE']).read_text())
        for role,c in fixture.items():self.login(role,{'email':c['email'],'senha':c['senha']})
        self.note('Bairro Centro reutilizado do seed; demais bases criadas via HTTP. Contas e documentos de autenticação são fixtures ORM sintéticas; rotas/vínculos/status somente pela API. Nenhum JWT forjado e nenhuma dependência substituída.')
        if self.hu=='012':
            for key,name in [('RP1','Rota Centro - UFC'),('RP2','Rota Campo Velho - IFCE'),('RP0','Rota Antiga')]:
                payload=self.principal(name)
                if key=='RP2':payload.update(horario_saida='06:40',horario_retorno='18:00',bairros_ids=[self.ids['B2']],faculdades_ida_ids=[self.ids['F2']],faculdades_volta_ids=[self.ids['F2']])
                _,b=self.post(payload,endpoint='/rotas-principais');self.ids[key]=b['data']['id']
            self.change(self.ids['RP0'],'inativar',endpoint='/rotas-principais')
        self.sql('Migrations aplicadas','SELECT version_num FROM alembic_version ORDER BY version_num')
        self.sql('Pré-condição: rotas vazias' if self.hu=='011' else 'Pré-condição: principais preparadas','SELECT id,nome,ativo FROM rota_principal ORDER BY id')
    def save(self):
        for k,c in self.cases.items():
            failed=[x for x in c['checks'] if not x['passed'] and x['severity_if_failed']=='failure'];warn=[x for x in c['checks'] if not x['passed'] and x['severity_if_failed']=='warning']
            if c.get('blocked_entire_case'):status='BLOCKED'
            elif failed:status='FAIL'
            elif c['dependencies']:status='PARTIAL' if c['checks'] else 'BLOCKED'
            elif warn:status='PARTIAL'
            else:status='PASS'
            c.update(status=status,finished_at=now(),issues=[])
            write(self.root/(k+'.json'),c)
        public_accounts={k:{'id':v.get('id'),'role':v.get('role'),'roles':v.get('roles')} for k,v in self.accounts.items()}
        write(self.root/'execucao.json',{'run_id':self.run_id,'environment':self.env,'started_at':self.start,'finished_at':now(),'fixture_ids':self.ids,'accounts':public_accounts,'cases':[{k:v for k,v in c.items() if k in {'case_id','status','dependencies'}} for c in self.cases.values()],'policy':'Respostas reais HTTP; credenciais/tokens/dados de conta redigidos. Ausência de HU-013 não foi simulada como aprovação. Operações de massa de rotas via API.'})
        print(json.dumps({k:c['status'] for k,c in self.cases.items()},ensure_ascii=False))

    def hu012(self):
        P='/rotas-principais';C=self.prefix;R=self.ids
        self.case(1);_,b=self.request('GET',C,expected=200);self.check('lista inicial vazia',[],b)
        self.case(2)
        principals_before=self.rows('SELECT id,nome,horario_saida,horario_retorno,ativo FROM rota_principal ORDER BY id')
        for key,payload in [('RC1',self.complementary('Van 2 - Bairro Novo',R['RP1'])),('RC2',dict(self.complementary('  Van 5 - Trevo da BR ',R['RP2']),horario_saida='06:10',ponto_conexao='  Posto da BR-122 '))]:
            _,b=self.post(payload);self.success(b);R[key]=b['data']['id'];d=self.get(R[key]);self.check(key+' trim do nome',payload['nome'].strip(),d.get('nome'));self.check(key+' trim do ponto',payload['ponto_conexao'].strip(),d.get('ponto_conexao'));self.check(key+' vínculo',payload['rota_principal_id'],d.get('rota_principal',{}).get('id'));self.check(key+' ativa',True,d.get('ativo'))
        self.sql('Complementares persistidas','SELECT id,nome,horario_saida,ponto_conexao,rota_principal_id,ativo FROM rota_complementar ORDER BY id')
        self.check('cadastro complementar não altera principais',principals_before,self.rows('SELECT id,nome,horario_saida,horario_retorno,ativo FROM rota_principal ORDER BY id'))
        self.case(3)
        for retorno,expected in [('17:40',201),('06:00',422),('05:30',422)]:
            _,b=self.post(dict(self.complementary('Van Retorno '+retorno),horario_retorno=retorno),expected=expected,note='retorno '+retorno)
            if expected==201:self.check('retorno devolvido',retorno,b.get('data',{}).get('horario_retorno'))
            else:self.detail(b,'horario_retorno','Horário de retorno deve ser maior que o horário de saída.')
        self.patch(R['RC1'],{'horario_retorno':'17:45'},note='editar retorno');d=self.get(R['RC1']);self.check('retorno persistido','17:45',d.get('horario_retorno'))
        self.case(4)
        for name in ['Van 2 - Bairro Novo','van 2 - bairro novo','  VAN 2 - BAIRRO NOVO ']:self.post(self.complementary(name),expected=409)
        status,b=self.post(self.complementary('Rota Centro - UFC'),expected=409,note='nome já usado pela principal')
        if status==201:self.change(b['data']['id'],'inativar');self.note('Complementar indevida com nome de principal inativada via HTTP após preservar a evidência.')
        self.patch(R['RC2'],{'nome':'Van 2 - Bairro Novo'},expected=409);self.patch(R['RC1'],{'nome':'Van 2 - Bairro Novo'})
        self.case(5)
        required={'nome':'Nome da rota complementar é obrigatório.','horario_saida':'Horário de saída é obrigatório.','ponto_conexao':'Ponto de conexão é obrigatório.','rota_principal_id':'Rota principal vinculada é obrigatória.'}
        for field,msg in required.items():
            payload=self.complementary('Controle ausente '+field);del payload[field];_,b=self.post(payload,expected=422);self.detail(b,field,msg)
        _,b=self.post({},expected=422);self.check('corpo vazio: quatro campos',set(required),{d.get('field') for d in b.get('error',{}).get('details',[])})
        for field in ['nome','ponto_conexao']:
            _,b=self.post(dict(self.complementary('Controle branco '+field),**{field:'   '}),expected=422);self.detail(b,field,required[field])
            for length,expected in [(150,201),(151,422)]:
                payload=self.complementary('Controle limite '+field+str(length));payload[field]='A'*length;_,b=self.post(payload,expected=expected)
                if expected==422:self.detail(b,field,('Nome da rota complementar' if field=='nome' else 'Ponto de conexão')+' deve ter no máximo 150 caracteres.')
                elif b.get('data',{}).get('id'):self.change(b['data']['id'],'inativar');self.note('Controle positivo do limite de '+field+' inativado por HTTP após consulta de persistência.')
        for hour in ['6:00','24:00','06:60','manhã']:
            _,b=self.post(dict(self.complementary('Controle hora '+hour),horario_saida=hour),expected=422);self.detail(b,'horario_saida','Horário deve estar no formato HH:MM.')
        for field in ['ponto_conexao','rota_principal_id']:self.patch(R['RC1'],{field:None},expected=422)
        self.case(6)
        for value in [R['RP0'],999999,0,-1,'1']:
            _,b=self.post(dict(self.complementary('Controle principal '+str(value)),rota_principal_id=value),expected=422)
            self.detail(b,'rota_principal_id','Rota principal inativa ou inexistente.' if value in [R['RP0'],999999] else 'Informe um ID de rota principal válido.')
        self.patch(R['RC1'],{'nome':'Van 2 - Editada','rota_principal_id':R['RP0']},expected=422)
        self.check('edição inválida atômica','Van 2 - Bairro Novo',self.get(R['RC1']).get('nome'))
        self.case(7)
        for patch in [{'nome':'Van 2 - Bairro Novo Manhã'},{'horario_saida':'05:50','ponto_conexao':'Praça do Bairro Novo'},{'rota_principal_id':R['RP2']},{'rota_principal_id':R['RP1']}]:
            _,b=self.patch(R['RC1'],patch);self.success(b);d=self.get(R['RC1']);self.check('mesmo id',R['RC1'],d.get('id'))
            for field,val in patch.items():self.check('campo alterado '+field,val,d.get('rota_principal',{}).get('id') if field=='rota_principal_id' else d.get(field))
            if patch.get('rota_principal_id')==R['RP2']:
                _,items=self.request('GET',C+f"?rota_principal_id={R['RP2']}",expected=200);self.check('filtro reflete troca',True,any(x['id']==R['RC1'] for x in items))
        _,b=self.patch(R['RC1'],{},expected=422);self.detail(b,'rota','Informe ao menos um campo para atualização.')
        self.patch(R['RC1'],{'ativo':False},expected=422);self.patch(999999,{'nome':'Qualquer'},expected=404)
        self.case(8);_,b=self.post(dict(self.complementary('Van Sítio',R['RP2']),horario_saida='05:40',ponto_conexao='Entrada do Sítio Riacho'));R['RC3']=b['data']['id']
        self.change(R['RC3'],'inativar');self.change(R['RC3'],'inativar',409);self.change(R['RC3'],'reativar');self.change(R['RC3'],'reativar',409);self.change(999999,'inativar',404);self.change(R['RC3'],'inativar')
        self.sql('Soft delete preserva a complementar','SELECT id,nome,ativo,rota_principal_id FROM rota_complementar WHERE id=%s',(R['RC3'],))
        self.case(4);self.post(self.complementary('Van Sítio'),expected=409,note='nome de complementar inativa')
        self.case(1)
        for query in ['', '?incluir_inativos=true','?nome=van','?nome=VAN%202',f"?rota_principal_id={R['RP1']}"]:
            _,b=self.request('GET',C+query,expected=200)
            if isinstance(b,list):
                if not query:self.check('padrão apenas ativas',True,all(x['ativo'] for x in b));self.check('RC3 fora padrão',False,any(x['id']==R['RC3'] for x in b))
                if 'incluir' in query:self.check('RC3 presente com inativos',True,any(x['id']==R['RC3'] and not x['ativo'] for x in b))
                if 'VAN' in query:self.check('filtro parcial case insensitive',True,all('van 2' in x['nome'].lower() for x in b))
                if 'rota_principal_id' in query:self.check('filtro por principal',True,all(x['rota_principal']['id']==R['RP1'] for x in b))
        _,b=self.request('GET',C+'?rota_principal_id=0',expected=422);self.detail(b,'rota_principal_id','Informe um ID de rota principal válido.')
        self.get(R['RC1']);self.get(R['RC3']);self.request('GET',C+'/999999',expected=404)
        _,b=self.request('GET',C+'/opcoes',expected=200);self.check('opções só principais ativas',{R['RP1'],R['RP2']},{x['id'] for x in b.get('rotas_principais',[])})
        self.case(9);_,b=self.change(R['RP2'],'inativar',409,endpoint=P);self.check('mensagem principal com complementar ativa','Esta rota possui rotas complementares ativas vinculadas. Inative ou desvincule as rotas complementares antes de continuar.',b.get('error',{}).get('message'),'warning')
        self.patch(R['RC2'],{'rota_principal_id':R['RP1']});self.change(R['RP2'],'inativar',endpoint=P);self.change(R['RP2'],'reativar',endpoint=P)
        self.case(10);self.change(R['RP2'],'inativar',endpoint=P);_,b=self.change(R['RC3'],'reativar',409)
        self.check('mensagem reativação com principal inativa','Não é possível reativar esta rota complementar pois a rota principal vinculada está inativa.',b.get('error',{}).get('message'),'warning')
        self.check('complementar permanece inativa',False,self.get(R['RC3']).get('ativo'))
        self.patch(R['RC3'],{'rota_principal_id':R['RP1']});self.change(R['RC3'],'reativar');self.change(R['RP2'],'reativar',endpoint=P)
        self.audit_case(11,R['RC1'])
        self.auth_case(12,R['RC1'],self.complementary('Nao autorizado QA'))
        self.dependency_case(13)

    def hu011(self):
        R=self.ids;P=self.prefix;C='/rotas-complementares'
        self.case(1);_,b=self.request('GET',P,expected=200);self.check('lista inicial vazia',[],b)
        _,b=self.request('GET',P+'/opcoes',expected=200)
        self.check('bairros ativos nas opções',{R['B1'],R['B2']},{x['id'] for x in b.get('bairros',[])})
        self.check('faculdades ativas nas opções',{R['F1'],R['F2'],R['F3']},{x['id'] for x in b.get('faculdades',[])})
        self.case(2);payload=self.principal('  Rota Centro - UFC  ');_,b=self.post(payload);self.success(b);R['RP1']=b['data']['id'];d=self.get(R['RP1'])
        self.check('nome normalizado','Rota Centro - UFC',d.get('nome'));self.check('criada ativa',True,d.get('ativo'))
        self.check('saída preservada','06:30',d.get('horario_saida'));self.check('retorno preservado','17:30',d.get('horario_retorno'))
        for field,key in [('bairros','B1'),('faculdades_ida','F1'),('faculdades_volta','F1')]:self.check(field,{R[key]},{x['id'] for x in d.get(field,[])})
        self.sql('Rota e três tabelas de vínculo','SELECT r.id,r.nome,r.horario_saida,r.horario_retorno,r.ativo,(SELECT json_agg(bairro_id ORDER BY bairro_id) FROM rota_principal_bairro b WHERE b.rota_id=r.id) bairros,(SELECT json_agg(faculdade_id ORDER BY faculdade_id) FROM rota_principal_faculdade_ida f WHERE f.rota_id=r.id) ida,(SELECT json_agg(faculdade_id ORDER BY faculdade_id) FROM rota_principal_faculdade_volta f WHERE f.rota_id=r.id) volta FROM rota_principal r WHERE id=%s',(R['RP1'],))
        self.case(3)
        payloads=[('RP2',dict(self.principal('Rota Integrada'),horario_saida='06:40',horario_retorno='18:00',bairros_ids=[R['B1'],R['B2']],faculdades_ida_ids=[R['F1'],R['F2'],R['F3']],faculdades_volta_ids=[R['F1']])),('RP3',dict(self.principal('Rota Centro - Faculdades'),horario_saida='06:20',horario_retorno='22:00',faculdades_ida_ids=[R['F1'],R['F2']],faculdades_volta_ids=[R['F3']]))]
        original=self.get(R['RP1'])
        for key,payload in payloads:
            _,b=self.post(payload);R[key]=b['data']['id'];d=self.get(R[key])
            for field in ['bairros','faculdades_ida','faculdades_volta']:self.check(key+' '+field,set(payload[field+'_ids']),{x['id'] for x in d.get(field,[])})
        self.check('RP1 não mudou',original,self.get(R['RP1']))
        for table in ['rota_principal_bairro','rota_principal_faculdade_ida','rota_principal_faculdade_volta']:self.sql('Vínculos persistidos: '+table,'SELECT * FROM '+table+' ORDER BY rota_id,2')
        self.case(4)
        for name in ['Rota Centro - UFC','rota centro - ufc','   ROTA CENTRO - UFC ']:self.post(self.principal(name),expected=409)
        self.patch(R['RP3'],{'nome':'Rota Centro - UFC'},expected=409);self.patch(R['RP1'],{'nome':'Rota Centro - UFC'})
        self.case(5)
        required={'nome':'Nome da rota é obrigatório.','horario_saida':'Horário de saída é obrigatório.','horario_retorno':'Horário de retorno é obrigatório.','bairros_ids':'Vincule ao menos um bairro.','faculdades_ida_ids':'Informe ao menos uma faculdade na ida.','faculdades_volta_ids':'Informe ao menos uma faculdade na volta.'}
        for field,msg in required.items():
            payload=self.principal('Controle ausente '+field);del payload[field];_,b=self.post(payload,expected=422);self.detail(b,field,msg)
        for value in ['   ',None]:
            _,b=self.post(dict(self.principal('Controle nome'),nome=value),expected=422);self.detail(b,'nome',required['nome'])
        for field in ['bairros_ids','faculdades_ida_ids','faculdades_volta_ids']:
            _,b=self.post(dict(self.principal('Controle lista '+field),**{field:[]}),expected=422);self.detail(b,field,required[field])
        _,b=self.post({},expected=422);self.check('corpo vazio identifica seis campos',set(required),{x.get('field') for x in b.get('error',{}).get('details',[])})
        _,b=self.post(self.principal('A'*150));control=b.get('data',{}).get('id')
        if control:self.change(control,'inativar');self.note('Controle positivo de 150 caracteres inativado via API para não interferir nos bloqueios de base.')
        _,b=self.post(self.principal('A'*151),expected=422);self.detail(b,'nome','Nome da rota deve ter no máximo 150 caracteres.')
        for field in ['bairros_ids','faculdades_volta_ids']:self.patch(R['RP1'],{field:[]},expected=422)
        self.case(6)
        for hour in ['6:30','24:00','06:60','06:30:00','manhã',630]:
            _,b=self.post(dict(self.principal('Controle horário '+str(hour)),horario_saida=hour),expected=422);self.detail(b,'horario_saida','Horário deve estar no formato HH:MM.')
        for out,back in [('07:00','07:00'),('23:00','01:00')]:
            _,b=self.post(dict(self.principal('Controle ordem '+out),horario_saida=out,horario_retorno=back),expected=422);self.detail(b,'horario_retorno','Horário de retorno deve ser maior que o horário de saída.')
        for out,back in [('00:00','23:59'),('13:15','13:16')]:
            _,b=self.post(dict(self.principal('Controle horário válido '+out),horario_saida=out,horario_retorno=back));rid=b.get('data',{}).get('id')
            if rid:
                d=self.get(rid);self.check('horários sem conversão',[out,back],[d.get('horario_saida'),d.get('horario_retorno')]);self.change(rid,'inativar')
        self.patch(R['RP1'],{'horario_retorno':'06:00'},expected=422);self.patch(R['RP1'],{'horario_saida':'18:00'},expected=422)
        self.case(7)
        variations=[('bairros_ids',[R['B0']]),('faculdades_ida_ids',[R['F0']]),('faculdades_volta_ids',[R['F0']]),('bairros_ids',[R['B1'],999999]),('bairros_ids',[R['B1'],R['B1']]),('faculdades_ida_ids',[R['F1'],R['F1']]),('bairros_ids',[0]),('bairros_ids',[-1]),('bairros_ids',['1'])]
        for idx,(field,values) in enumerate(variations):
            _,b=self.post(dict(self.principal('Controle vínculo '+str(idx)),**{field:values}),expected=422);self.detail(b,field)
            messages=[d.get('message','') for d in b.get('error',{}).get('details',[]) if d.get('field')==field]
            if idx in {0,1,2,3}:self.check('mensagem vínculo inativo/inexistente',True,any(('inativo ou inexistente' in m or 'inativa ou inexistente' in m) for m in messages))
            if idx in {4,5}:self.check('mensagem duplicidade da lista',True,any('duplicad' in m.lower() or 'repetid' in m.lower() for m in messages))
            if idx in {6,7,8}:self.check('mensagem ID positivo estrito',True,any(m=='Informe IDs válidos (números inteiros positivos).' for m in messages))
        self.patch(R['RP1'],{'nome':'Rota Centro - UFC Editada','faculdades_ida_ids':[R['F0']]},expected=422);self.check('edição inválida atômica','Rota Centro - UFC',self.get(R['RP1'])['nome'])
        self.case(8)
        others_before=[self.get(R['RP2']),self.get(R['RP3'])]
        for patch in [{'nome':'Rota Centro - UFC Manhã'},{'horario_saida':'06:00','horario_retorno':'18:00'},{'bairros_ids':[R['B2']],'faculdades_ida_ids':[R['F2']],'faculdades_volta_ids':[R['F3']]}]:
            _,b=self.patch(R['RP1'],patch);self.success(b);d=self.get(R['RP1']);self.check('mesmo id',R['RP1'],d['id'])
            for field,val in patch.items():self.check('campo editado '+field,set(val) if field.endswith('_ids') else val,{x['id'] for x in d.get(field[:-4],[])} if field.endswith('_ids') else d.get(field))
        _,b=self.patch(R['RP1'],{},expected=422);self.detail(b,'rota','Informe ao menos um campo para atualização.')
        self.patch(R['RP1'],{'ativo':False},expected=422);self.patch(999999,{'nome':'Qualquer'},expected=404)
        self.sql('Vínculos antigos substituídos','SELECT * FROM rota_principal_bairro WHERE rota_id=%s',(R['RP1'],))
        self.check('edição RP1 não altera RP2/RP3',others_before,[self.get(R['RP2']),self.get(R['RP3'])])
        self.case(9);d0=self.get(R['RP2']);self.change(R['RP2'],'inativar');self.change(R['RP2'],'inativar',409);self.change(R['RP2'],'reativar');self.change(R['RP2'],'reativar',409);self.change(999999,'inativar',404);self.change(R['RP2'],'inativar')
        d=self.get(R['RP2']);self.check('vínculos preservados soft delete',[d0[k] for k in ['bairros','faculdades_ida','faculdades_volta']],[d[k] for k in ['bairros','faculdades_ida','faculdades_volta']])
        self.sql('Linha preservada após inativar','SELECT * FROM rota_principal WHERE id=%s',(R['RP2'],))
        self.case(4);self.post(self.principal('Rota Integrada'),expected=409,note='nome de principal inativa')
        self.case(1)
        for q in ['', '?incluir_inativos=true','?nome=centro','?nome=CENTRO']:
            _,b=self.request('GET',P+q,expected=200)
            if not q:self.check('padrão só ativas',True,all(x['ativo'] for x in b));self.check('RP2 ausente padrão',False,any(x['id']==R['RP2'] for x in b))
            if 'incluir' in q:self.check('RP2 aparece inativa',True,any(x['id']==R['RP2'] and not x['ativo'] for x in b))
            if 'nome=' in q:self.check('filtro case insensitive',True,all('centro' in x['nome'].lower() for x in b))
            for item in b:self.check('contrato de leitura com listas e horários',True,all(k in item for k in ['id','nome','horario_saida','horario_retorno','ativo','bairros','faculdades_ida','faculdades_volta']))
        self.get(R['RP1']);self.get(R['RP2']);self.request('GET',P+'/999999',expected=404)
        self.case(10);_,b=self.post({'nome':'Van Trevo','horario_saida':'06:00','ponto_conexao':'Trevo do Bairro Novo','rota_principal_id':R['RP1']},endpoint=C);R['RC1']=b['data']['id']
        _,b=self.change(R['RP1'],'inativar',409);self.check('mensagem complementar ativa','Esta rota possui rotas complementares ativas vinculadas. Inative ou desvincule as rotas complementares antes de continuar.',b.get('error',{}).get('message'),'warning')
        self.check('principal continua ativa',True,self.get(R['RP1'])['ativo']);self.change(R['RC1'],'inativar',endpoint=C);self.change(R['RP1'],'inativar');self.change(R['RP1'],'reativar')
        self.case(4);status,b=self.post(self.principal('Van Trevo'),expected=409,note='nome já usado pela complementar inativa')
        if status==201:self.change(b['data']['id'],'inativar');self.note('Principal indevida com nome duplicado foi inativada por HTTP para não contaminar os próximos casos.')
        self.case(11)
        for endpoint,key,msg in [('/bairros','B1','Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar.'),('/faculdades','F3','Esta faculdade não pode ser inativada pois pertence a uma rota ativa. Remova-a da rota antes de continuar.')]:
            _,b=self.change(R[key],'inativar',409,endpoint=endpoint);self.check('mensagem base em rota ativa '+key,msg,b.get('error',{}).get('message'))
        self.change(R['RP1'],'inativar');self.change(R['RP3'],'inativar')
        self.change(R['B1'],'inativar',endpoint='/bairros');self.change(R['F3'],'inativar',endpoint='/faculdades')
        _,b=self.change(R['RP3'],'reativar',409);self.check('reativação com base inativa','Esta rota possui bairro ou faculdade inativo e não pode ser reativada. Atualize os vínculos antes.',b.get('error',{}).get('message'))
        self.change(R['F3'],'ativar',endpoint='/faculdades');self.change(R['B1'],'ativar',endpoint='/bairros');self.change(R['RP3'],'reativar');self.change(R['RP1'],'reativar')
        self.audit_case(12,R['RP1']);self.auth_case(13,R['RP1'],self.principal('Nao autorizado QA'));self.dependency_case(14)

    def audit_case(self,n,rid):
        self.case(n);entity='rota_principal' if self.hu=='011' else 'rota_complementar'
        prefix=self.prefix
        for op in self.operations:
            if not op['path'].startswith(prefix):continue
            if op['status'] in {200,201} and not op['unchanged']:
                delta=[r for r in op['audit_delta'] if r['entidade']==entity]
                self.check('auditoria única escrita seq '+str(op['sequence']),1,len(delta))
                for row in delta:
                    self.check('executor auditoria seq '+str(op['sequence']),self.accounts['admin']['id'],row['usuario_id'])
                    self.check('auditoria com data/hora',True,row['criado_em'] is not None)
                    action='CRIAR' if op['method']=='POST' else 'INATIVAR' if op['path'].endswith('/inativar') else 'REATIVAR' if op['path'].endswith('/reativar') else 'EDITAR'
                    self.check('ação auditoria seq '+str(op['sequence']),action,row['acao'])
                    self.check('id auditado seq '+str(op['sequence']),str(op['response_id']),str(row['entidade_id']))
                    if action in {'CRIAR','EDITAR'}:
                        new=json.loads(row['valor_novo']) if row['valor_novo'] else {}
                        for field,val in (op['body'] or {}).items():
                            expected=val.strip() if isinstance(val,str) else sorted(val) if isinstance(val,list) else val
                            actual=new.get(field)
                            if isinstance(actual,list):actual=sorted(actual)
                            self.check('snapshot novo '+field+' seq '+str(op['sequence']),expected,actual)
        d=self.get(rid);before=len(self.audit());self.patch(rid,{'nome':d['nome']});self.check('edição sem mudança não audita',before,len(self.audit()))
        self.sql('Auditoria completa da HU','SELECT id,usuario_id,acao,entidade,entidade_id,valor_anterior,valor_novo,criado_em FROM log_auditoria WHERE entidade=%s ORDER BY id',(entity,))
    def auth_case(self,n,rid,payload):
        self.case(n)
        endpoints=[('GET',self.prefix,None),('GET',self.prefix+'/opcoes',None),('GET',self.prefix+f'/{rid}',None),('POST',self.prefix,payload),('PATCH',self.prefix+f'/{rid}',{'nome':'Sem permissao'}),('PATCH',self.prefix+f'/{rid}/inativar',None),('PATCH',self.prefix+f'/{rid}/reativar',None)]
        before=self.state();aud0=len(self.audit())
        for role in ['aluno','representante','none']:
            if role!='none' and role not in self.tokens:self.blocked('Login real do perfil '+role+' indisponível; não foi forjado JWT');continue
            for method,path,body in endpoints:self.request(method,path,body,role=role,expected=401 if role=='none' else 403,label=role+' '+method+' '+path)
        self.check('acesso recusado não altera rotas',before,self.state());self.check('acesso recusado não gera auditoria',aud0,len(self.audit()))
    def dependency_case(self,n):
        self.case(n)
        _,openapi=self.request('GET','/openapi.json',role='none',expected=200,label='verificar disponibilidade real da HU-013')
        paths=sorted(p for p in openapi.get('paths',{}) if 'agend' in p)
        self.note('Endpoints de agendamento disponíveis: '+json.dumps(paths,ensure_ascii=False))
        self.blocked('HU-013 não implementada nesta versão: sem entidade/endpoints de agendamentos. Não foi criada agenda diretamente no banco e não houve simulação do checker.')
        self.current['blocked_entire_case']=True

if __name__=='__main__':
    suite=Suite(os.environ['QA_HU'])
    try:
        suite.setup()
        if suite.hu=='012':suite.hu012()
        else:suite.hu011()
    finally:suite.save()
