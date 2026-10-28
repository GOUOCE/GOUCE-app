import unittest

from pydantic import TypeAdapter, ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from src.modulos.crud_basicos.domain.entities.bairro import BairroORM
from src.modulos.crud_basicos.domain.entities.faculdade import FaculdadeORM
from src.modulos.crud_basicos.domain.entities.ponto_de_parada import PontoDeParadaORM
from src.modulos.usuarios.infrastructure.repositories.usuario_repository import SQLAlchemyUsuarioRepository
from src.modulos.usuarios.application.use_cases.validar_vinculos_aluno_use_case import (
    ValidarVinculosAlunoUseCase,
    VinculoAlunoValidationError,
)
from src.shared.infrastructure.db import Base
from src.shared.validators.id_localidade_validator import IdLocalidade


class VinculosAlunoTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine, tables=[
            BairroORM.__table__, PontoDeParadaORM.__table__, FaculdadeORM.__table__,
        ])
        self.session = Session(self.engine)
        self.session.add_all([
            BairroORM(bairro_id=7, nome="Centro", ativo=True),
            BairroORM(bairro_id=8, nome="Serra", ativo=False),
            FaculdadeORM(id_faculdade=9, nome_faculdade="Universidade", campus_faculdade="Quixadá", ativo=True),
            FaculdadeORM(id_faculdade=10, nome_faculdade="Instituto", campus_faculdade="Fortaleza", ativo=False),
        ])
        self.session.commit()
        self.use_case = ValidarVinculosAlunoUseCase(SQLAlchemyUsuarioRepository(self.session))

    def tearDown(self):
        self.session.close()
        self.engine.dispose()

    def test_aceita_vinculos_existentes_e_ativos(self):
        self.use_case.execute(7, 9)

    def test_rejeita_vinculos_inexistentes_e_inativos(self):
        for bairro, faculdade, campo in [(8, 9, "bairro_id"), (999, 9, "bairro_id"), (7, 10, "faculdade_id"), (7, 999, "faculdade_id")]:
            with self.subTest(bairro=bairro, faculdade=faculdade):
                with self.assertRaises(VinculoAlunoValidationError) as erro:
                    self.use_case.execute(bairro, faculdade)
                self.assertEqual(erro.exception.field, campo)

    def test_ids_nao_aceitam_nomes_booleanos_decimais_ou_overflow(self):
        adapter = TypeAdapter(IdLocalidade)
        for valor in ["Centro", "Outro", "", True, 0, -1, 1.5, "1.5", "99999999999999999999"]:
            with self.subTest(valor=valor), self.assertRaises(ValidationError):
                adapter.validate_python(valor)
        self.assertEqual(adapter.validate_python("7"), 7)
        self.assertEqual(adapter.validate_python(7), 7)
