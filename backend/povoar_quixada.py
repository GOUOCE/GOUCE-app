# -*- coding: utf-8 -*-
import os
import sys
from datetime import datetime, timezone, timedelta

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
from src.shared.security.lgpd_encryption import encrypt_val, hash_email, hash_telefone
from src.shared.security.argon2_hasher import Argon2PasswordHasher
from sqlalchemy import text


def povoar_dados_quixada():
    db = SessionLocal()
    hasher = Argon2PasswordHasher()

    try:
        print("🧹 Limpando dados de exemplo e inicializando base limpa de Quixadá...")

        # 1. Truncar todas as tabelas operacionais em ordem limpa
        with engine.begin() as conn:
            tabelas = [
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

        # 2. Administrador Geral do Sistema
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

        # 3. Faculdades Reais de Quixadá
        print("🏫 Cadastrando Faculdades Reais de Quixadá-CE...")
        f_ufc = FaculdadeORM(
            nome_faculdade="Universidade Federal do Ceará",
            sigla="UFC",
            campus_faculdade="Campus Quixadá",
            ativo=True
        )
        f_ifce = FaculdadeORM(
            nome_faculdade="Instituto Federal do Ceará",
            sigla="IFCE",
            campus_faculdade="Campus Quixadá",
            ativo=True
        )
        f_uece = FaculdadeORM(
            nome_faculdade="Universidade Estadual do Ceará",
            sigla="UECE",
            campus_faculdade="FECLEISC - Quixadá",
            ativo=True
        )
        f_unicatolica = FaculdadeORM(
            nome_faculdade="Centro Universitário Católica do Quixadá",
            sigla="UNICATÓLICA",
            campus_faculdade="Campus Quixadá",
            ativo=False
        )
        db.add_all([f_ufc, f_ifce, f_uece, f_unicatolica])
        db.commit()

        # 4. Bairros e Pontos de Parada Reais de Quixadá
        print("📍 Cadastrando Bairros e Pontos de Parada Reais de Quixadá...")
        b_centro = BairroORM(
            nome="Centro",
            ativo=True,
            pontos_de_parada=[
                PontoDeParadaORM(nome="Igreja Matriz de Quixadá", ativo=True),
                PontoDeParadaORM(nome="Praça dos Leões", ativo=True),
                PontoDeParadaORM(nome="Mercado Público Central", ativo=True),
            ]
        )
        b_campo_novo = BairroORM(
            nome="Campo Novo",
            ativo=True,
            pontos_de_parada=[
                PontoDeParadaORM(nome="Terminal Rodoviário de Quixadá", ativo=True),
                PontoDeParadaORM(nome="Posto de Saúde do Campo Novo", ativo=True),
            ]
        )
        b_brasilia = BairroORM(
            nome="Alto da Brasília",
            ativo=True,
            pontos_de_parada=[
                PontoDeParadaORM(nome="Acesso ao Campus da UFC", ativo=True),
                PontoDeParadaORM(nome="EEEP Maria Cavalcante Costa", ativo=True),
            ]
        )
        b_baviera = BairroORM(
            nome="Baviera",
            ativo=True,
            pontos_de_parada=[
                PontoDeParadaORM(nome="Hospital Maternidade Jesus Maria José", ativo=True),
                PontoDeParadaORM(nome="Praça da Baviera", ativo=True),
            ]
        )
        b_renascer = BairroORM(
            nome="Planalto Renascer",
            ativo=False,
            pontos_de_parada=[
                PontoDeParadaORM(nome="Entrada do Bairro", ativo=False),
            ]
        )
        db.add_all([b_centro, b_campo_novo, b_brasilia, b_baviera, b_renascer])
        db.commit()

        # 5. Frota de Ônibus de Quixadá
        print("🚌 Cadastrando Frota de Ônibus Operacional...")
        o1 = OnibusORM(placa_onibus="QXD2E46", apelido_onibus="Ônibus 01 - Rota Fortaleza Manhã", qtd_assentos=48, capacidade_maxima=12, ativo=True)
        o2 = OnibusORM(placa_onibus="QXD5A82", apelido_onibus="Ônibus 02 - Rota Fortaleza Tarde", qtd_assentos=48, capacidade_maxima=12, ativo=True)
        o3 = OnibusORM(placa_onibus="PNX7K19", apelido_onibus="Ônibus 03 - Rota Canindé Diurno", qtd_assentos=42, capacidade_maxima=10, ativo=True)
        o4 = OnibusORM(placa_onibus="OZA9C31", apelido_onibus="Ônibus 04 - Reserva Técnica", qtd_assentos=30, capacidade_maxima=5, ativo=False)
        db.add_all([o1, o2, o3, o4])
        db.commit()

        # 6. Motoristas
        print("👨‍✈️ Cadastrando Motoristas...")
        m1 = MotoristaORM(nome_completo="Carlos Alberto Silva", telefone="(88) 99911-2233", telefone_hash=hash_telefone("(88) 99911-2233"), ativo=True)
        m2 = MotoristaORM(nome_completo="Roberto Souza Alencar", telefone="(88) 98822-3344", telefone_hash=hash_telefone("(88) 98822-3344"), ativo=True)
        m3 = MotoristaORM(nome_completo="Francisco José Oliveira", telefone="(88) 99733-4455", telefone_hash=hash_telefone("(88) 99733-4455"), ativo=False)
        db.add_all([m1, m2, m3])
        db.commit()

        # 7. Arquivos Físicos Fakes para FK de Documentos
        print("📄 Criando registros de arquivos de mídia...")
        db.add_all([
            ArquivoORM(id="foto.jpg", nome="foto_perfil.jpg", url="http://minio/smp-fotos/foto.jpg", content_type="image/jpeg"),
            ArquivoORM(id="res.pdf", nome="comprovante_residencia.pdf", url="http://minio/smp-fotos/res.pdf", content_type="application/pdf"),
            ArquivoORM(id="mat.pdf", nome="comprovante_matricula.pdf", url="http://minio/smp-fotos/mat.pdf", content_type="application/pdf"),
        ])
        db.commit()

        # 8. Alunos para Demonstração de HU-001, HU-027, HU-031 e HU-030
        print("🎓 Cadastrando Alunos Reais para Demonstração...")
        data_validade = datetime.now(timezone.utc) + timedelta(days=180)

        # 8a. Aluno Aprovado (Ativo)
        u_aprovado = UsuarioORM(
            nome_completo="Lucas Andrade Silva",
            email="lucas.andrade@aluno.ufc.br",
            email_hash=hash_email("lucas.andrade@aluno.ufc.br"),
            senha=hasher.hash("Senha@123"),
            telefone="(88) 99444-1111",
            ativo=True
        )
        db.add(u_aprovado)
        db.flush()
        db.add(UsuarioTipoORM(id_usuario=u_aprovado.id, id_tipo=1))
        db.add(AlunoORM(
            aluno_id=u_aprovado.id,
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
        ))

        # 8b. Aluno Pendente na Fila (HU-027 e HU-031)
        u_pendente = UsuarioORM(
            nome_completo="Carlos Eduardo Martins",
            email="aluno.pendente.hu@gmail.com",
            email_hash=hash_email("aluno.pendente.hu@gmail.com"),
            senha=hasher.hash("Senha@123"),
            telefone="(88) 99111-9999",
            ativo=True
        )
        db.add(u_pendente)
        db.flush()
        db.add(UsuarioTipoORM(id_usuario=u_pendente.id, id_tipo=1))
        db.add(AlunoORM(
            aluno_id=u_pendente.id,
            curso="Engenharia de Software",
            periodo_ingresso="2024.1",
            turno_curso="Integral",
            faculdade_id=f_ufc.id_faculdade,
            bairro_id=b_campo_novo.bairro_id,
            status_cadastro="pendente",
            data_hora_envio_analise=datetime.now(timezone.utc),
            id_foto_aluno="foto.jpg",
            id_comprovante_residencia="res.pdf",
            id_comprovante_matricula="mat.pdf",
            identificacao_genero="Masculino",
            identificacao_sexual="Heterossexual",
            raca="Parda",
            transgenero="nao",
            data_nascimento=20020820,
            tem_filhos=False,
            termos_de_uso=True
        ))

        # 8c. Aluna Rejeitada "Ana" (HU-031)
        u_ana = UsuarioORM(
            nome_completo="Ana",
            email="aluno.rejeitado.hu@gmail.com",
            email_hash=hash_email("aluno.rejeitado.hu@gmail.com"),
            senha=hasher.hash("Senha@123"),
            telefone="(88) 99222-8888",
            ativo=True
        )
        db.add(u_ana)
        db.flush()
        db.add(UsuarioTipoORM(id_usuario=u_ana.id, id_tipo=1))
        db.add(AlunoORM(
            aluno_id=u_ana.id,
            curso="Ciência da Computação",
            periodo_ingresso="2024.2",
            turno_curso="Noturno",
            faculdade_id=f_ifce.id_faculdade,
            bairro_id=b_brasilia.bairro_id,
            status_cadastro="rejeitado",
            motivo_reprovacao="Comprovante de residência ilegível. Por favor, reenvie um comprovante atualizado de no máximo 3 meses.",
            documentos_reenvio=[{"tipo": "comprovante_residencia", "motivo": "Comprovante de residência ilegível. Por favor, reenvie um comprovante atualizado de no máximo 3 meses."}],
            id_foto_aluno="foto.jpg",
            id_comprovante_residencia="res.pdf",
            id_comprovante_matricula="mat.pdf",
            identificacao_genero="Feminino",
            identificacao_sexual="Heterossexual",
            raca="Branca",
            transgenero="nao",
            data_nascimento=20030310,
            tem_filhos=False,
            termos_de_uso=True
        ))

        # 8d. Aluna Promovida a Representante da UFC Quixadá (HU-030)
        u_rep = UsuarioORM(
            nome_completo="Juliana Mendes Rocha",
            email="juliana.mendes@aluno.ufc.br",
            email_hash=hash_email("juliana.mendes@aluno.ufc.br"),
            senha=hasher.hash("Senha@123"),
            telefone="(88) 99655-4433",
            ativo=True
        )
        db.add(u_rep)
        db.flush()
        db.add(UsuarioTipoORM(id_usuario=u_rep.id, id_tipo=1))
        db.add(UsuarioTipoORM(id_usuario=u_rep.id, id_tipo=3))
        db.add(AlunoORM(
            aluno_id=u_rep.id,
            curso="Engenharia de Software",
            periodo_ingresso="2023.1",
            turno_curso="Integral",
            faculdade_id=f_ufc.id_faculdade,
            bairro_id=b_centro.bairro_id,
            status_cadastro="ativado",
            validade_acesso=data_validade,
            id_foto_aluno="foto.jpg",
            id_comprovante_residencia="res.pdf",
            id_comprovante_matricula="mat.pdf",
            identificacao_genero="Feminino",
            identificacao_sexual="Heterossexual",
            raca="Branca",
            transgenero="nao",
            data_nascimento=20011125,
            tem_filhos=False,
            termos_de_uso=True
        ))
        db.add(RepresentanteORM(administrador_id=u_rep.id, id_faculdade_responsavel=f_ufc.id_faculdade, is_representante_ativo=True))

        db.commit()
        print("  ✓ Alunos de demonstração cadastrados com sucesso.")

        # 9. Rotas Principais (HU-011) e Complementares (HU-012)
        print("🗺️ Cadastrando Rotas Universitárias de Quixadá...")
        r_fortaleza = RotaPrincipalORM(
            nome="Quixadá ➔ Fortaleza (Manhã)",
            horario_saida="05:30:00",
            horario_retorno="17:00:00",
            ativo=True
        )
        r_caninde = RotaPrincipalORM(
            nome="Quixadá ➔ Canindé (Diurno)",
            horario_saida="06:00:00",
            horario_retorno="18:00:00",
            ativo=True
        )
        db.add_all([r_fortaleza, r_caninde])
        db.commit()

        # Vinculando Bairros e Faculdades à Rota Principal
        r_fortaleza.bairros = [b_centro, b_campo_novo, b_brasilia]
        r_fortaleza.faculdades_ida = [f_ufc, f_ifce]
        r_fortaleza.faculdades_volta = [f_ufc, f_ifce]

        r_caninde.bairros = [b_centro, b_baviera]
        r_caninde.faculdades_ida = [f_uece]
        r_caninde.faculdades_volta = [f_uece]
        db.commit()

        # Rota Complementar (HU-012)
        r_comp = RotaComplementarORM(
            nome="Transferência Centro ➔ Rodoviária",
            ponto_conexao="Terminal Rodoviário de Quixadá",
            horario_saida="05:00:00",
            horario_retorno="17:30:00",
            rota_principal_id=r_fortaleza.id,
            ativo=True
        )
        db.add(r_comp)
        db.commit()

        print("\n✨ BANCO DE DADOS DE QUIXADÁ POVOADO COM SUCESSO E SEM ERROS DE ACENTUAÇÃO/ENCODING!\n")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Erro ao povoar dados de Quixadá: {e}\n")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    povoar_dados_quixada()
