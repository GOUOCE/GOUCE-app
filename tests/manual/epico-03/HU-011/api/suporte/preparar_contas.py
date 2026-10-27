"""Somente massa de autenticação sintética; não cria rotas nem agendas."""
import os, sys, json, uuid, secrets
from datetime import datetime, timezone, timedelta
sys.path.insert(0,os.getcwd())
from src.shared.infrastructure.db import SessionLocal
from src.shared.security.lgpd_encryption import hash_email
from src.modulos.usuarios.model.entities.usuario import UsuarioORM
from src.modulos.usuarios.model.entities.aluno import AlunoORM
from src.modulos.usuarios.model.entities.tipo import TipoORM
from src.modulos.usuarios.model.entities.usuario_tipo import UsuarioTipoORM
from src.modulos.usuarios.model.entities.representante import RepresentanteORM
from src.modulos.arquivos.model.entities.arquivo import ArquivoORM
from argon2 import PasswordHasher
with SessionLocal() as db:
    fid=db.execute(__import__('sqlalchemy').text('SELECT id_faculdade FROM faculdade ORDER BY id_faculdade LIMIT 1')).scalar()
    bid=db.execute(__import__('sqlalchemy').text('SELECT bairro_id FROM bairro ORDER BY bairro_id LIMIT 1')).scalar()
    assert fid and bid,'Preparar bairro/faculdade pela API primeiro'
    accounts={}
    for role in ['aluno','representante']:
        email=f'{role}.qa@example.com';password='Qa!'+secrets.token_urlsafe(20)+'8aA'
        u=UsuarioORM(nome_completo='Pessoa Sintetica QA',email=email,email_hash=hash_email(email),senha=PasswordHasher().hash(password),ativo=True)
        db.add(u);db.flush()
        docs=[]
        for _ in range(2):
            a=ArquivoORM(id=str(uuid.uuid4()),nome='Documento sintetico QA',url='http://fixture.invalid/documento.pdf',content_type='application/pdf',tamanho_bytes=1)
            db.add(a);docs.append(a.id)
        db.flush()
        db.add(AlunoORM(aluno_id=u.id,status_cadastro='ativado',faculdade_id=fid,bairro_id=bid,id_comprovante_matricula=docs[0],id_comprovante_residencia=docs[1],data_nascimento=20000101,identificacao_genero='Outro',tem_filhos=False,curso='Curso QA',semestre_atual=1,periodo_ingresso='2026.1',turno_curso='Matutino',raca='Outro',transgenero='Nao',termos_de_uso=True,validade_acesso=datetime.now(timezone.utc)+timedelta(days=180)))
        tipo=db.query(TipoORM).filter_by(tipo_usuario=role).first()
        if not tipo:tipo=TipoORM(tipo_usuario=role);db.add(tipo);db.flush()
        db.add(UsuarioTipoORM(id_usuario=u.id,id_tipo=tipo.id))
        if role=='representante':db.add(RepresentanteORM(administrador_id=u.id,is_representante_ativo=True,id_faculdade_responsavel=fid))
        accounts[role]={'id':u.id,'email':email,'senha':password,'fixture_origin':'ORM: usuário/aluno/documentos fictícios e perfil; rotas apenas via HTTP'}
    db.commit()
path=__import__('pathlib').Path(os.environ['QA_ACCOUNTS_FILE']);path.write_text(json.dumps(accounts));path.chmod(0o600)
print('Massa sintética de aluno e representante preparada; credenciais somente no arquivo privado.')
