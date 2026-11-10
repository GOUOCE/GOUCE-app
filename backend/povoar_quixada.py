# -*- coding: utf-8 -*-
import os
import sys
from datetime import datetime, timezone, timedelta, date

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.shared.infrastructure.db import SessionLocal, engine
from src.modulos.arquivos.model.entities.arquivo import ArquivoORM
from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
from src.modulos.crud_basicos.domain.entities.ponto_de_parada import PontoDeParadaORM
from src.modulos.crud_basicos.domain.entities.onibus import OnibusORM
from src.modulos.motoristas.model.entities.motorista import MotoristaORM
from src.modulos.usuarios.model.entities.usuario import UsuarioORM
from src.modulos.usuarios.model.entities.aluno import AlunoORM
from src.modulos.usuarios.model.entities.administrador import AdministradorORM
from src.modulos.usuarios.model.entities.representante import RepresentanteORM
from src.modulos.usuarios.model.entities.usuario_tipo import UsuarioTipoORM
from src.modulos.usuarios.model.entities.tipo import TipoORM
from src.modulos.rotas.model.entities.rota_principal import RotaPrincipalORM
from src.modulos.rotas.model.entities.rota_complementar import RotaComplementarORM
from src.modulos.agendamentos.model.entities.agendamento import AgendamentoORM
from src.modulos.agendamentos.model.entities.feriado import FeriadoORM
from src.shared.security.lgpd_encryption import encrypt_val, hash_email, hash_telefone
from src.shared.security.argon2_hasher import Argon2PasswordHasher
from sqlalchemy import text


def povoar_dados_quixada():
    db = SessionLocal()
    hasher = Argon2PasswordHasher()

    try:
        print("🧹 Limpando dados de exemplo e inicializando base limpa de Quixadá...")

        with engine.begin() as conn:
            tabelas = [
                "agendamento",
                "feriado_recesso",
                "rota_complementar",
                "rota_principal_faculdade_volta",
                "rota_principal_faculdade_ida",
                "rota_principal_bairro",
                "rota_principal",
                "ponto_de_parada",
                "bairro",
                "onibus",
                "motorista",
                "representante",
                "aluno",
                "administrador",
                "usuario_tipo",
                "tipo",
                "password_reset_token",
                "arquivos",
                "faculdade",
                "usuario",
            ]
            for t in tabelas:
                conn.execute(text(f'TRUNCATE TABLE "{t}" RESTART IDENTITY CASCADE;'))

        print("🌱 Cadastrando Tipos de Usuário...")
        t1 = TipoORM(id=1, tipo_usuario="aluno")
        t2 = TipoORM(id=2, tipo_usuario="administrador")
        t3 = TipoORM(id=3, tipo_usuario="representante")
        db.add_all([t1, t2, t3])
        db.commit()

        print("👤 Cadastrando Administrador Padrão...")
        admin_email = "admin@gouce.com.br"
        u_admin = UsuarioORM(
            nome_completo="Administrador Geral",
            email=admin_email,
            email_hash=hash_email(admin_email),
            senha=hasher.hash("Admin@123456"),
            telefone="(88) 99999-0000",
            ativo=True
        )
        db.add(u_admin)
        db.flush()
        db.add(UsuarioTipoORM(id_usuario=u_admin.id, id_tipo=2))
        db.add(AdministradorORM(administrador_id=u_admin.id, is_administrador_ativo=True))
        db.commit()

        print("🏫 Cadastrando Faculdades Reais de Quixadá-CE...")
        f_ufc = FaculdadeORM(nome_faculdade="Universidade Federal do Ceará", sigla="UFC", campus_faculdade="Campus Quixadá", ativo=True)
        f_ifce = FaculdadeORM(nome_faculdade="Instituto Federal do Ceará", sigla="IFCE", campus_faculdade="Campus Quixadá", ativo=True)
        f_uece = FaculdadeORM(nome_faculdade="Universidade Estadual do Ceará", sigla="UECE", campus_faculdade="FECLEISC - Quixadá", ativo=True)
        f_unicatolica = FaculdadeORM(nome_faculdade="Centro Universitário Católica do Quixadá", sigla="UNICATÓLICA", campus_faculdade="Campus Quixadá", ativo=False)
        db.add_all([f_ufc, f_ifce, f_uece, f_unicatolica])
        db.commit()

        print("📍 Cadastrando Bairros e Pontos de Parada Reais de Quixadá...")
        p1 = PontoDeParadaORM(nome="Igreja Matriz de Quixadá", ativo=True)
        p2 = PontoDeParadaORM(nome="Praça dos Leões", ativo=True)
        p3 = PontoDeParadaORM(nome="Mercado Público Central", ativo=True)
        b_centro = BairroORM(nome="Centro", ativo=True, pontos_de_parada=[p1, p2, p3])

        p4 = PontoDeParadaORM(nome="Terminal Rodoviário de Quixadá", ativo=True)
        p5 = PontoDeParadaORM(nome="Posto de Saúde do Campo Novo", ativo=True)
        b_campo_novo = BairroORM(nome="Campo Novo", ativo=True, pontos_de_parada=[p4, p5])

        p6 = PontoDeParadaORM(nome="Acesso ao Campus da UFC", ativo=True)
        p7 = PontoDeParadaORM(nome="EEEP Maria Cavalcante Costa", ativo=True)
        b_brasilia = BairroORM(nome="Alto da Brasília", ativo=True, pontos_de_parada=[p6, p7])

        db.add_all([b_centro, b_campo_novo, b_brasilia])
        db.commit()

        print("🚌 Cadastrando Frota de Ônibus Operacional...")
        o1 = OnibusORM(placa_onibus="QXD2E46", apelido_onibus="Ônibus 01 - Rota Fortaleza Manhã", qtd_assentos=48, capacidade_maxima=12, ativo=True)
        o2 = OnibusORM(placa_onibus="QXD5A82", apelido_onibus="Ônibus 02 - Rota Fortaleza Tarde", qtd_assentos=48, capacidade_maxima=12, ativo=True)
        db.add_all([o1, o2])
        db.commit()

        print("👨‍✈️ Cadastrando Motoristas...")
        m1 = MotoristaORM(nome_completo="Carlos Alberto Silva", telefone="(88) 99911-2233", telefone_hash=hash_telefone("(88) 99911-2233"), ativo=True)
        db.add(m1)
        db.commit()

        print("📄 Criando registros de arquivos de mídia...")
        db.add_all([
            ArquivoORM(id="foto.jpg", nome="foto_perfil.jpg", url="http://minio/smp-fotos/foto.jpg", content_type="image/jpeg"),
            ArquivoORM(id="res.pdf", nome="comprovante_residencia.pdf", url="http://minio/smp-fotos/res.pdf", content_type="application/pdf"),
            ArquivoORM(id="mat.pdf", nome="comprovante_matricula.pdf", url="http://minio/smp-fotos/mat.pdf", content_type="application/pdf"),
        ])
        db.commit()

        print("🎓 Cadastrando Aluno de Demonstração (Lucas Andrade)...")
        data_validade = datetime.now(timezone.utc) + timedelta(days=180)

        u_aluno = UsuarioORM(
            nome_completo="Lucas Andrade Silva",
            email="lucas.andrade@aluno.ufc.br",
            email_hash=hash_email("lucas.andrade@aluno.ufc.br"),
            senha=hasher.hash("Senha@123"),
            telefone="(88) 99444-1111",
            ativo=True
        )
        db.add(u_aluno)
        db.flush()
        db.add(UsuarioTipoORM(id_usuario=u_aluno.id, id_tipo=1))

        aluno_orm = AlunoORM(
            aluno_id=u_aluno.id,
            curso="Engenharia de Software",
            periodo_ingresso="2024.1",
            turno_curso="Integral",
            faculdade_id=f_ufc.id_faculdade,
            bairro_id=b_centro.bairro_id,
            status_cadastro="ativado",
            validade_acesso=data_validade,
            id_foto_aluno="foto.jpg",
            id_comprovante_residencia="res.pdf",
            id_comprovante_matricula="mat.pdf",
            identificacao_genero="Masculino",
            identificacao_sexual="Heterossexual",
            raca="Parda",
            transgenero="nao",
            data_nascimento=20010515,
            tem_filhos=False,
            termos_de_uso=True
        )
        db.add(aluno_orm)
        db.commit()

        print("🗺️ Cadastrando Rotas Universitárias de Quixadá...")
        r_fortaleza = RotaPrincipalORM(
            nome="Quixadá ➔ Fortaleza (Manhã)",
            horario_saida="05:30:00",
            horario_retorno="17:00:00",
            ativo=True
        )
        db.add(r_fortaleza)
        db.commit()

        r_fortaleza.bairros = [b_centro, b_campo_novo, b_brasilia]
        r_fortaleza.faculdades_ida = [f_ufc, f_ifce]
        r_fortaleza.faculdades_volta = [f_ufc, f_ifce]
        db.commit()

        print("🎉 Cadastrando Feriados e Recessos Reais (Novembro 2026)...")
        db.add_all([
            FeriadoORM(data=date(2026, 11, 15), tipo="FERIADO", descricao="Proclamação da República"),
            FeriadoORM(data=date(2026, 11, 16), tipo="FERIADO", descricao="Feriado Municipal"),
            FeriadoORM(data=date(2026, 11, 17), tipo="RECESSO", descricao="Recesso Acadêmico"),
        ])
        db.commit()

        print("📅 Cadastrando Reservas de Transporte Reais para o Aluno (HU-014)...")
        db.add_all([
            AgendamentoORM(
                aluno_id=aluno_orm.aluno_id,
                data=date(2026, 11, 10),
                usa_ida=True,
                usa_volta=True,
                ponto_embarque_id=p1.ponto_id,
                ies_destino_id=f_ufc.id_faculdade,
                ies_origem_id=f_ufc.id_faculdade,
                ponto_desembarque_id=p4.ponto_id,
                status="ATIVO"
            ),
            AgendamentoORM(
                aluno_id=aluno_orm.aluno_id,
                data=date(2026, 11, 12),
                usa_ida=True,
                usa_volta=False,
                ponto_embarque_id=p2.ponto_id,
                ies_destino_id=f_ufc.id_faculdade,
                status="ATIVO"
            ),
            AgendamentoORM(
                aluno_id=aluno_orm.aluno_id,
                data=date(2026, 11, 17),
                usa_ida=False,
                usa_volta=True,
                ies_origem_id=f_ifce.id_faculdade,
                ponto_desembarque_id=p1.ponto_id,
                status="ATIVO"
            ),
            AgendamentoORM(
                aluno_id=aluno_orm.aluno_id,
                data=date(2026, 12, 2),
                usa_ida=True,
                usa_volta=True,
                ponto_embarque_id=p1.ponto_id,
                ies_destino_id=f_ufc.id_faculdade,
                ies_origem_id=f_ufc.id_faculdade,
                ponto_desembarque_id=p4.ponto_id,
                status="ATIVO"
            ),
        ])
        db.commit()

        print("\n✨ BANCO DE DADOS DE QUIXADÁ POVOADO COM SUCESSO!\n")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Erro ao povoar dados de Quixadá: {e}\n")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    povoar_dados_quixada()
