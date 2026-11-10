"""Execução HTTP real da suíte manual HU-014; sem mocks ou override da API.

Rodar no container isolado: consulta, cancelamento, integridade, conferencia.
Credenciais são lidas do ambiente e nunca gravadas nas evidências.
"""

import calendar
import importlib.metadata
import inspect
import json
import os
import platform
import sys
import time
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import main  # Registra os modelos reais; não cria tabelas nem altera dependencies.
from argon2 import PasswordHasher
from sqlalchemy import text

from src.modulos.arquivos.model.entities.arquivo import ArquivoORM
from src.modulos.usuarios.model.entities.aluno import AlunoORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM
from src.shared.infrastructure.db import SessionLocal, engine
from src.shared.security.lgpd_encryption import hash_email


OUT = Path('/evidence')
BASE = '/transporte/agendamentos'
URL = 'http://127.0.0.1:8000'
PASSWORD = os.environ['HU014_ACCOUNT_PASSWORD']
TOKENS = {}
STATE = {}
CASES = {}


def write(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2, default=str) + '\n')


def sql(statement, values=None):
    # Cada leitura usa conexão nova: não confere só o estado em memória da API.
    with engine.begin() as conn:
        result = conn.execute(text(statement), values or {})
        return [dict(row) for row in result.mappings()] if result.returns_rows else []


def case(number):
    return CASES.setdefault(number, {'id': f'CT-HU014-API-{number}', 'http': [],
                                     'checks': [], 'database': [], 'blocked': []})


def check(number, description, valid, actual=None):
    case(number)['checks'].append({'description': description, 'passed': bool(valid), 'actual': actual})
    write(f'CT-HU014-API-{number}.json', case(number))


def request(method, path, actor='A', body=None, number=None, expected=None):
    headers = {'Content-Type': 'application/json'}
    if actor in TOKENS:
        headers['Authorization'] = 'Bearer ' + TOKENS[actor]
    elif actor == 'invalid':
        headers['Authorization'] = 'Bearer token-invalido-de-teste'
    started = time.perf_counter()
    req = Request(URL + path, data=json.dumps(body).encode() if body is not None else None,
                  headers=headers, method=method)
    try:
        response = urlopen(req, timeout=30)
    except HTTPError as error:
        response = error
    raw = response.read().decode()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {'raw': raw}
    elapsed = round((time.perf_counter() - started) * 1000, 3)
    record = {'method': method, 'path': path, 'actor': actor,
              'request_body': body, 'http': response.code, 'elapsed_ms': elapsed, 'response': data}
    if number:
        case(number)['http'].append(record)
        write(f'CT-HU014-API-{number}.json', case(number))
        if expected is not None:
            check(number, f'{method} {path}: HTTP {expected}', response.code == expected, response.code)
    return response.code, data, elapsed


def login(actor, email):
    # A requisição de login e seus tokens não entram no diário HTTP.
    code, data, _ = request('POST', '/auth/login', actor=None,
                            body={'email': email, 'senha': PASSWORD, 'lembrar_me': False})
    if code != 200:
        raise RuntimeError(f'Login da conta sintética {actor} não disponível: HTTP {code}')
    TOKENS[actor] = data['token_acesso']
    return {'actor': actor, 'http': code, 'id': data['usuario']['id'],
            'role': data['usuario']['role'],
            'status': data['usuario'].get('status_cadastro'),
            'access_expired': data['usuario'].get('acesso_expirado')}


def payload(target, ida=True, volta=True):
    return {'data': str(target), 'usa_ida': ida, 'usa_volta': volta,
            'ponto_embarque_id': STATE['point'] if ida else None,
            'ies_destino_id': STATE['faculty'] if ida else None,
            'ies_origem_id': STATE['faculty'] if volta else None,
            'ponto_desembarque_id': STATE['point'] if volta else None}


def booking(target, actor='A', ida=True, volta=True, number=None):
    code, data, _ = request('POST', BASE, actor, payload(target, ida, volta), number, 200 if number else None)
    if code != 200 or not data.get('agendamento'):
        raise RuntimeError(f'Preparação da reserva de {actor} em {target}: HTTP {code}; {data}')
    return data['agendamento']['id']


def snapshot(number, label, ids):
    values = {'ids': ids}
    value = {'label': label,
             'bookings': sql('SELECT * FROM agendamento WHERE id = ANY(:ids) ORDER BY id', values),
             'logs': sql("SELECT * FROM log_auditoria WHERE entidade='agendamento' "
                         'AND entidade_id::text = ANY(:ids) ORDER BY id', {'ids': [str(x) for x in ids]})}
    case(number)['database'].append(value)
    write(f'CT-HU014-API-{number}.json', case(number))
    return value


def finish(number):
    item = case(number)
    item['finished_at'] = datetime.now().astimezone().isoformat()
    item['status'] = ('FAIL' if any(not c['passed'] for c in item['checks']) else
                      'PARTIAL' if item['blocked'] else 'PASS')
    write(f'CT-HU014-API-{number}.json', item)
    print(item['id'], item['status'], len(item['checks']), 'verificações')
    for c in item['checks']:
        if not c['passed']:
            print('  FALHOU:', c['description'], c['actual'])


def actors_fixture():
    ids = {}
    with SessionLocal() as session:
        file = ArquivoORM(id=str(uuid.uuid4()), nome='fixture HU014',
                          url='fixture://hu014/documento-sintetico', content_type='application/pdf', tamanho_bytes=0)
        session.add(file)
        session.flush()
        tipo = session.execute(text("SELECT id FROM tipo WHERE tipo_usuario='aluno'")).scalar_one()
        for label, status, expired in [('A', 'ativado', False), ('B', 'ativado', False),
                                       ('pending', 'pendente', False), ('expired', 'ativado', True)]:
            email = f'{label.lower()}.hu014@example.com'
            user = UsuarioORM(nome_completo=f'Aluno Sintetico {label}', email=email,
                              email_hash=hash_email(email), senha=PasswordHasher().hash(PASSWORD), ativo=True)
            session.add(user)
            session.flush()
            session.add(AlunoORM(aluno_id=user.id, status_cadastro=status, faculdade_id=STATE['faculty'],
                                 bairro_id=STATE['neighborhood'], id_comprovante_matricula=file.id,
                                 id_comprovante_residencia=file.id, data_nascimento=20000101,
                                 identificacao_genero='Nao informado', raca='Nao informado', transgenero='Nao',
                                 tem_filhos=False, curso='Curso de Teste', semestre_atual=1,
                                 periodo_ingresso='2026.1', turno_curso='Matutino', termos_de_uso=True,
                                 validade_acesso=datetime.now(timezone.utc) + timedelta(days=-1 if expired else 180)))
            session.execute(text('INSERT INTO usuario_tipo (id_usuario,id_tipo) VALUES (:u,:t)'),
                            {'u': user.id, 't': tipo})
            ids[label] = user.id
        session.commit()
    return ids


def consulta():
    if (OUT / 'massa.json').exists():
        raise RuntimeError('Esta execução já tem massa: use volume/projeto e diretório novos para uma nova rodada.')
    today = datetime.now().astimezone().date()
    STATE['D'] = str(today)
    preparation = []
    preparation.append(login('admin', 'admin.hu014@example.com'))
    _, bairro, _ = request('POST', '/bairros', 'admin',
                           {'nome_bairro': 'Bairro QA HU', 'pontos_de_parada': ['Ponto QA HU014']}, '001', 201)
    STATE['neighborhood'] = bairro['data']['bairro_id']
    STATE['point'] = bairro['data']['pontos_de_parada'][0]['ponto_id']
    _, faculty, _ = request('POST', '/faculdades', 'admin',
                            {'nome': 'Instituicao QA HU014', 'sigla': 'QAHU', 'campus': 'Campus Teste'}, '001', 201)
    STATE['faculty'] = faculty['data']['id_faculdade']
    STATE['actors'] = actors_fixture()
    for actor in STATE['actors']:
        preparation.append(login(actor, f'{actor.lower()}.hu014@example.com'))
    check('002', 'Banco isolado sem rota ativa antes da preparação',
          sql('SELECT count(*) AS n FROM rota_principal WHERE ativo')[0]['n'] == 0)
    _, initial_calendar, _ = request('GET', BASE + '/calendario?mes=' + today.strftime('%Y-%m'),
                                     number='002', expected=200)
    free = next(d for d in initial_calendar['dias'] if d['data'] == str(today))
    check('002', 'Dia sem rota ativa: INDISPONIVEL, sem permissão de agendar',
          free['estado'] == 'INDISPONIVEL' and not free['pode_agendar'], free)
    _, route, _ = request('POST', '/rotas-principais', 'admin',
                          {'nome': 'Rota QA HU014', 'horario_saida': '06:30', 'horario_retorno': '18:30',
                           'bairros_ids': [STATE['neighborhood']], 'faculdades_ida_ids': [STATE['faculty']],
                           'faculdades_volta_ids': [STATE['faculty']]}, '001', 201)
    STATE['route'] = route['data']['id']
    STATE['B1'] = booking(today + timedelta(days=1), 'B', number='001')
    _, empty, _ = request('GET', BASE + '/meus', number='001', expected=200)
    check('001', 'Lista vazia de A apesar da reserva de B', empty == {'agendamentos': [], 'ativos': 0, 'limite': 22}, empty)
    STATE['A1'] = booking(today + timedelta(days=1), number='001')
    _, one, _ = request('GET', BASE + '/meus', number='001', expected=200)
    check('001', 'Limite de um item, somente A1', one['ativos'] == 1 and [x['id'] for x in one['agendamentos']] == [STATE['A1']])
    STATE['A2'] = booking(today + timedelta(days=2), ida=True, volta=False, number='001')
    STATE['A3'] = booking(today + timedelta(days=3), ida=False, volta=True, number='001')
    with engine.begin() as conn:
        STATE['AP'] = conn.execute(text('INSERT INTO agendamento '
            '(aluno_id,data,usa_ida,usa_volta,ponto_embarque_id,ies_destino_id,status) '
            "VALUES (:u,:d,true,false,:p,:f,'ATIVO') RETURNING id"),
            {'u': STATE['actors']['A'], 'd': today - timedelta(days=1), 'p': STATE['point'], 'f': STATE['faculty']}).scalar_one()
        for offset, kind in [(4, 'FERIADO'), (5, 'RECESSO')]:
            conn.execute(text('INSERT INTO feriado_recesso (data,tipo,descricao) VALUES (:d,:t,:n)'),
                         {'d': today + timedelta(days=offset), 't': kind, 'n': f'{kind} sintetico HU014'})
    _, full, _ = request('GET', BASE + '/meus', number='001', expected=200)
    check('001', 'Três ativos futuros ordenados, sem AP/B1', full['ativos'] == 3 and
          [x['id'] for x in full['agendamentos']] == [STATE[k] for k in ('A1', 'A2', 'A3')], full)
    check('001', 'Dono, nomes de ponto/IES e flags consistentes', all(
        x['aluno_id'] == STATE['actors']['A'] and x['status'] == 'ATIVO' and
        x['pode_remover'] and x['pode_editar'] and
        (not x['usa_ida'] or (x['ponto_embarque_nome'] == 'Ponto QA HU014' and x['ies_destino_nome'] == 'Instituicao QA HU014')) and
        (not x['usa_volta'] or (x['ponto_desembarque_nome'] == 'Ponto QA HU014' and x['ies_origem_nome'] == 'Instituicao QA HU014'))
        for x in full['agendamentos']))
    _, b_list, _ = request('GET', BASE + '/meus', 'B', number='001', expected=200)
    check('001', 'B vê somente B1', [x['id'] for x in b_list['agendamentos']] == [STATE['B1']])
    snapshot('001', 'massa_por_consulta_independente', [STATE[k] for k in ('A1', 'A2', 'A3', 'AP', 'B1')])
    finish('001')

    following = (today.replace(day=1) + timedelta(days=32)).replace(day=1)
    if following <= today + timedelta(days=29):
        cross_id = booking(following, number='002')
        for month in [today.strftime('%Y-%m'), following.strftime('%Y-%m')]:
            _, body, _ = request('GET', BASE + '/calendario?mes=' + month, number='002', expected=200)
            dates = [date.fromisoformat(d['data']) for d in body['dias']]
            check('002', f'{month}: datas válidas, únicas e no mês', len(dates) == len(set(dates)) and
                  all(d.strftime('%Y-%m') == month and d.day <= calendar.monthrange(d.year, d.month)[1] for d in dates))
            check('002', f'{month}: contador global de ativos igual a /meus', body['ativos'] == 4 and body['limite'] == 22)
            days = {d['data']: d for d in body['dias']}
            if month == today.strftime('%Y-%m'):
                a1 = days[str(today + timedelta(days=1))]
                past = days[str(today - timedelta(days=1))]
                check('002', 'A1: AGENDADO com id/flags corretos', a1['estado'] == 'AGENDADO' and
                      a1['agendamento_id'] == STATE['A1'] and a1['pode_remover'] and a1['pode_editar'] and not a1['pode_agendar'], a1)
                check('002', 'Histórico AP com flags falsas', past['agendamento_id'] == STATE['AP'] and
                      not past['pode_remover'] and not past['pode_editar'], past)
                check('002', 'Dia livre com rota: DISPONIVEL', days[str(today)]['estado'] == 'DISPONIVEL' and days[str(today)]['pode_agendar'])
                for offset, kind in [(4, 'FERIADO'), (5, 'RECESSO')]:
                    item = days[str(today + timedelta(days=offset))]
                    check('002', kind + ': bloqueado e com descrição', item['estado'] == kind and not item['pode_agendar'] and bool(item['descricao']), item)
            else:
                check('002', 'Reserva na virada do mês tem o id real', days[str(following)]['agendamento_id'] == cross_id)
        request('DELETE', f'{BASE}/{cross_id}', number='002', expected=200)
    else:
        case('002')['blocked'].append('Virada do mês fora da janela corrente; não se alterou o relógio do servidor.')
    for query in ['?mes=2026-1', '?mes=2026-13', '']:
        _, error, _ = request('GET', BASE + '/calendario' + query, number='002', expected=422)
        check('002', 'Validação do mês produz mensagem de erro', bool(error.get('detail') or error.get('error')), error)
    finish('002')

    before = snapshot('003', 'antes_das_consultas', [STATE[k] for k in ('A1', 'A2', 'A3', 'AP', 'B1')])
    for key in ['A1', 'A2', 'A3', 'AP']:
        _, detail, elapsed = request('GET', f'{BASE}/{STATE[key]}', number='003', expected=200)
        flags = key != 'AP'
        check('003', f'{key}: dono, flags e trechos reais', detail['aluno_id'] == STATE['actors']['A'] and
              detail['pode_remover'] == flags and detail['pode_editar'] == flags and
              detail['usa_ida'] == (key != 'A3') and detail['usa_volta'] == (key in ['A1', 'A3']), detail)
        if key == 'A1':
            check('003', 'GET de referência HTTP em até 3000 ms (sem renderização móvel)', elapsed <= 3000, elapsed)
    for item_id in [STATE['B1'], 999999999]:
        _, error, _ = request('GET', f'{BASE}/{item_id}', number='003', expected=404)
        check('003', 'Não encontrado sem exposição do dono', error.get('error', {}).get('code') == 'RESOURCE_NOT_FOUND' and
              error['error']['message'] == 'Agendamento não encontrado.', error)
    request('GET', f'{BASE}/{STATE["B1"]}', 'B', number='003', expected=200)
    after = snapshot('003', 'depois_das_consultas', [STATE[k] for k in ('A1', 'A2', 'A3', 'AP', 'B1')])
    check('003', 'GETs não mudam reservas nem logs', before['bookings'] == after['bookings'] and before['logs'] == after['logs'])
    finish('003')
    write('massa.json', STATE)
    write('preparacao.json', {'logins_sem_tokens': preparation, 'fixtures':
          ['Contas sintéticas via ORM com criptografia e hash reais; documentos de fixture sem conteúdo pessoal.',
           'Cadastros de bairro/ponto/IES/rota e reservas futuras via HTTP.',
           'AP de ontem e feriado/recesso inseridos diretamente só no banco isolado.',
           'Cenário sem rota coletado antes da criação da rota, sem alterar massa compartilhada.']})


def cancel_verify(number, item_id, actor='A'):
    before = snapshot(number, 'antes_delete_' + str(item_id), [item_id, STATE['B1']])
    _, previous, _ = request('GET', BASE + '/meus', actor, number=number, expected=200)
    _, response, elapsed = request('DELETE', f'{BASE}/{item_id}', actor, number=number, expected=200)
    check(number, 'Mensagem, estado e contador da resposta', response.get('mensagem') == 'Agendamento cancelado com sucesso' and
          response.get('estado_dia') == 'DISPONIVEL' and response.get('ativos') == previous['ativos'] - 1 and response.get('limite') == 22, response)
    _, current, _ = request('GET', BASE + '/meus', actor, number=number, expected=200)
    check(number, 'Reserva saiu da lista e contador reduziu uma vez', current['ativos'] == previous['ativos'] - 1 and
          item_id not in [x['id'] for x in current['agendamentos']])
    request('GET', f'{BASE}/{item_id}', actor, number=number, expected=404)
    after = snapshot(number, 'depois_delete_' + str(item_id), [item_id, STATE['B1']])
    old = next(x for x in before['bookings'] if x['id'] == item_id)
    new = next(x for x in after['bookings'] if x['id'] == item_id)
    check(number, 'Persistido CANCELADO com data; dono/data/trechos mantidos', new['status'] == 'CANCELADO' and
          new['cancelled_at'] is not None and all(old[k] == new[k] for k in ['aluno_id', 'data', 'usa_ida', 'usa_volta']))
    logs = [x for x in after['logs'] if str(x['entidade_id']) == str(item_id) and x['acao'] == 'CANCELAR']
    check(number, 'Exatamente um log CANCELAR com executor e entidade corretos', len(logs) == 1 and logs[0]['usuario_id'] == STATE['actors'][actor], logs)
    check(number, 'Reserva de B preservada', [x for x in before['bookings'] if x['id'] == STATE['B1']] ==
          [x for x in after['bookings'] if x['id'] == STATE['B1']])
    _, calendar_data, _ = request('GET', BASE + '/calendario?mes=' + str(new['data'])[:7], actor, number=number, expected=200)
    day = next(d for d in calendar_data['dias'] if d['data'] == str(new['data']))
    check(number, 'Calendário atualizado: dia disponível e contador real', day['estado'] == 'DISPONIVEL' and
          day['agendamento_id'] is None and day['pode_agendar'] and calendar_data['ativos'] == current['ativos'], day)
    return elapsed


def cancelamento():
    today = date.fromisoformat(STATE['D'])
    if today != datetime.now().astimezone().date():
        raise RuntimeError('A execução atravessou a meia-noite; recalcular massa antes de prosseguir.')
    for key in ['A1', 'A2', 'A3']:
        elapsed = cancel_verify('004', STATE[key])
        if key == 'A1':
            check('004', 'DELETE de referência HTTP em até 3000 ms', elapsed <= 3000, elapsed)
    finish('004')

    try:
        for label, start, end in [('antes_saida', '23:30', '23:59'), ('apos_saida', '00:00', '00:01')]:
            request('PATCH', f'/rotas-principais/{STATE["route"]}', 'admin',
                    {'horario_saida': start, 'horario_retorno': end}, '005', 200)
            now = datetime.now().astimezone()
            current_time = now.strftime('%H:%M')
            possible = current_time < start if label == 'antes_saida' else current_time > start
            if not possible:
                case('005')['blocked'].append(f'{label}: horário local {current_time} não permite a variação com saída {start}')
                continue
            item_id = booking(today, number='005')
            case('005')['database'].append({'label': label, 'server_time': now.isoformat(), 'route_departure': start, 'booking_id': item_id})
            cancel_verify('005', item_id)
    finally:
        request('PATCH', f'/rotas-principais/{STATE["route"]}', 'admin',
                {'horario_saida': '06:30', 'horario_retorno': '18:30'}, '005', 200)
    finish('005')

    before = snapshot('006', 'historico_antes', [STATE['AP']])
    for method, body in [('DELETE', None), ('PUT', {'data': str(today - timedelta(days=1)), 'usa_ida': False, 'usa_volta': False})]:
        _, error, _ = request(method, f'{BASE}/{STATE["AP"]}', body=body, number='006', expected=422)
        check('006', method + ': AGENDAMENTO_PASSADO com mensagem correta', error.get('error', {}).get('code') == 'AGENDAMENTO_PASSADO' and
              error['error']['message'] == 'Não é possível cancelar agendamento de data já passada.', error)
    _, detail, _ = request('GET', f'{BASE}/{STATE["AP"]}', number='006', expected=200)
    check('006', 'Flags do histórico continuam falsas', not detail['pode_remover'] and not detail['pode_editar'])
    after = snapshot('006', 'historico_depois', [STATE['AP']])
    check('006', 'Histórico e logs intactos nos dois caminhos', before['bookings'] == after['bookings'] and before['logs'] == after['logs'])
    finish('006')

    before = snapshot('007', 'antes_recusas', [STATE['A1'], STATE['B1']])
    _, prior_a, _ = request('GET', BASE + '/meus', number='007', expected=200)
    _, prior_b, _ = request('GET', BASE + '/meus', 'B', number='007', expected=200)
    for item_id in [STATE['A1'], STATE['B1'], 999999999]:
        _, error, _ = request('DELETE', f'{BASE}/{item_id}', number='007', expected=404)
        check('007', 'Recusa como RESOURCE_NOT_FOUND', error.get('error', {}).get('code') == 'RESOURCE_NOT_FOUND', error)
    request('DELETE', BASE + '/abc', number='007', expected=422)
    after = snapshot('007', 'depois_recusas', [STATE['A1'], STATE['B1']])
    _, after_a, _ = request('GET', BASE + '/meus', number='007', expected=200)
    _, after_b, _ = request('GET', BASE + '/meus', 'B', number='007', expected=200)
    check('007', 'Sem dupla redução, duplicação de log ou mudança em B', before['bookings'] == after['bookings'] and
          before['logs'] == after['logs'] and prior_a == after_a and prior_b == after_b)
    finish('007')

    STATE['access_booking'] = booking(today + timedelta(days=9), number='008')
    before = snapshot('008', 'antes_matriz_acesso', [STATE['access_booking']])
    _, prior, _ = request('GET', BASE + '/meus', number='008', expected=200)
    for actor, status in [(None, 401), ('invalid', 401), ('admin', 403), ('pending', 403), ('expired', 403)]:
        for method, path in [('GET', BASE + '/meus'), ('GET', BASE + '/calendario?mes=' + today.strftime('%Y-%m')),
                             ('GET', f'{BASE}/{STATE["access_booking"]}'), ('DELETE', f'{BASE}/{STATE["access_booking"]}')]:
            request(method, path, actor, number='008', expected=status)
    after = snapshot('008', 'depois_matriz_acesso', [STATE['access_booking']])
    _, following, _ = request('GET', BASE + '/meus', number='008', expected=200)
    check('008', 'Todas as recusas preservam reserva, contador e logs', before['bookings'] == after['bookings'] and
          before['logs'] == after['logs'] and prior == following)
    finish('008')

    _, initial, _ = request('GET', BASE + '/meus', number='009', expected=200)
    used = {x['data'] for x in initial['agendamentos']}
    holidays = {str(x['data']) for x in sql('SELECT data FROM feriado_recesso')}
    created = []
    for offset in range(30):
        target = today + timedelta(days=offset)
        if initial['ativos'] + len(created) >= 22:
            break
        if str(target) not in used and str(target) not in holidays:
            created.append(booking(target, number='009'))
    _, full, _ = request('GET', BASE + '/meus', number='009', expected=200)
    check('009', 'Exatamente 22 reservas ativas em datas distintas', full['ativos'] == 22 and len({x['data'] for x in full['agendamentos']}) == 22)
    old_id = next(x['id'] for x in full['agendamentos'] if x['data'] == str(today + timedelta(days=1)))
    cancel_verify('009', old_id)
    _, lower, _ = request('GET', BASE + '/meus', number='009', expected=200)
    new_id = booking(today + timedelta(days=1), number='009')
    _, restored, _ = request('GET', BASE + '/meus', number='009', expected=200)
    check('009', '22 → 21 → 22, novo id, cancelado não conta', lower['ativos'] == 21 and restored['ativos'] == 22 and
          new_id != old_id and old_id not in [x['id'] for x in restored['agendamentos']] and new_id in [x['id'] for x in restored['agendamentos']])
    snapshot('009', 'cancelado_e_reagendado', [old_id, new_id, STATE['B1']])
    STATE['integrity_booking'] = new_id
    finish('009')
    write('massa.json', STATE)


def integridade():
    from src.modulos.agendamentos.infrastructure.repositories.agendamento_repository import AgendamentoRepository
    item_id = STATE['integrity_booking']
    tables = sql("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%aloca%'")
    case('010')['database'].append({'allocation_tables': tables, 'remove_allocations_source': inspect.getsource(AgendamentoRepository.remove_allocations)})
    case('010')['blocked'].append('Sem tabela/fluxo real de alocação HU-016/018; liberação de vaga e atomicidade com alocação não verificáveis. Não foi criada alocação fictícia.')
    before = snapshot('010', 'antes_falha_controlada', [item_id, STATE['B1']])
    _, prior, _ = request('GET', BASE + '/meus', number='010', expected=200)
    try:
        sql("""CREATE FUNCTION qa_hu014_fail_cancel() RETURNS trigger LANGUAGE plpgsql AS $$
            BEGIN
              IF NEW.entidade='agendamento' AND NEW.acao='CANCELAR' AND NEW.entidade_id::text='""" + str(item_id) + """' THEN
                RAISE EXCEPTION 'QA_HU014_FALHA_CONTROLADA_ANTES_COMMIT';
              END IF;
              RETURN NEW;
            END $$""")
        sql('CREATE TRIGGER qa_hu014_fail_cancel BEFORE INSERT ON log_auditoria '
            'FOR EACH ROW EXECUTE FUNCTION qa_hu014_fail_cancel()')
        request('DELETE', f'{BASE}/{item_id}', number='010', expected=500)
        after = snapshot('010', 'apos_rollback_nova_conexao', [item_id, STATE['B1']])
        _, current, _ = request('GET', BASE + '/meus', number='010', expected=200)
        check('010', 'Falha real antes do commit preserva reserva, B, logs e contador',
              before['bookings'] == after['bookings'] and before['logs'] == after['logs'] and prior == current)
    finally:
        sql('DROP TRIGGER IF EXISTS qa_hu014_fail_cancel ON log_auditoria')
        sql('DROP FUNCTION IF EXISTS qa_hu014_fail_cancel()')
    cancel_verify('010', item_id)
    check('010', 'Instrumentação de banco removida', not sql("SELECT tgname FROM pg_trigger WHERE tgname='qa_hu014_fail_cancel'"))
    finish('010')


def conferencia():
    # Fecha as leituras previstas na suíte após a massa ter sido consumida.
    for number in ['006', '009']:
        CASES[number] = json.loads((OUT / f'CT-HU014-API-{number}.json').read_text())
    month = (date.fromisoformat(STATE['D']) - timedelta(days=1)).strftime('%Y-%m')
    _, body, _ = request('GET', BASE + '/calendario?mes=' + month, number='006', expected=200)
    past = next(day for day in body['dias'] if day['agendamento_id'] == STATE['AP'])
    check('006', 'Calendário final mantém histórico e flags protegidos', past['estado'] == 'AGENDADO' and
          not past['pode_remover'] and not past['pode_editar'], past)
    finish('006')
    after = snapshot('009', 'conferencia_final_B', [STATE['B1']])
    old = next(entry for entry in CASES['009']['database'] if entry['label'] == 'cancelado_e_reagendado')
    previous_b = [row for row in old['bookings'] if row['id'] == STATE['B1']]
    actual_b = json.loads(json.dumps(after['bookings'], default=str))
    check('009', 'B1 segue intacta após POST de reagendamento e integridade', previous_b == actual_b)
    finish('009')


def main_run():
    OUT.mkdir(exist_ok=True, parents=True)
    database = sql('SELECT current_database() AS name')[0]['name']
    if database != 'hu014_qa':
        raise RuntimeError('Executor restrito ao banco isolado hu014_qa.')
    if (OUT / 'massa.json').exists():
        STATE.update(json.loads((OUT / 'massa.json').read_text()))
    phase = sys.argv[1]
    if phase != 'consulta':
        login('admin', 'admin.hu014@example.com')
        for actor in STATE['actors']:
            login(actor, f'{actor.lower()}.hu014@example.com')
    if phase == 'consulta':
        write('ambiente.json', {'started_at': datetime.now().astimezone().isoformat(), 'api_url': 'http://127.0.0.1:8014',
              'request_origin': 'Cliente urllib em processo separado dentro do container, via TCP localhost:8000 para Uvicorn real.',
              'python': platform.python_version(), 'dependencies': {x: importlib.metadata.version(x) for x in ['fastapi','SQLAlchemy','pydantic','alembic','psycopg2-binary']},
              'timezone': os.environ.get('TZ'), 'database': sql('SELECT version() AS version'),
              'alembic': sql('SELECT version_num FROM alembic_version'),
              'constraints': sql("SELECT indexname,indexdef FROM pg_indexes WHERE tablename='agendamento' ORDER BY indexname"),
              'product_mutations': 'Nenhuma alteração no código do produto, sem dependency override, sem mock.'})
        _, spec, _ = request('GET', '/openapi.json', actor=None)
        write('contrato.json', {'paths': {k:v for k,v in spec['paths'].items() if k.startswith(BASE)},
              'schemas': {k:v for k,v in spec['components']['schemas'].items() if 'Agendamento' in k or 'Calendario' in k}})
        consulta()
    elif phase == 'cancelamento':
        cancelamento()
    elif phase == 'integridade':
        integridade()
    elif phase == 'conferencia':
        conferencia()
    else:
        raise RuntimeError('Fase inválida')
    if any(item.get('status') == 'FAIL' for item in CASES.values()):
        raise SystemExit(1)


if __name__ == '__main__':
    main_run()
