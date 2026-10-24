import unittest
from datetime import datetime, timezone
from types import SimpleNamespace

from src.modulos.usuarios.application.use_cases.aprovar_aluno_use_case import (
    AprovarAlunoUseCase,
    somar_meses,
)


class FakeApprovalRepository:
    def __init__(self):
        self.aluno = SimpleNamespace(aluno_id=4, status_cadastro="analise_renovacao", motivo_reprovacao=None)
        self.chamada = None

    def buscar_aluno_por_id(self, aluno_id):
        return self.aluno

    def normalizar_documentos_reenvio(self, documentos):
        return documentos

    def atualizar_status_aluno(self, **kwargs):
        self.chamada = kwargs
        self.aluno.status_cadastro = kwargs["novo_status"]
        return self.aluno


class AprovarAlunoValidadeTest(unittest.TestCase):
    def test_aprovar_renovacao_define_validade_de_seis_meses(self):
        # HU-028: o aluno renovado continuava com o vínculo vencido após a aprovação.
        repository = FakeApprovalRepository()
        antes = datetime.now(timezone.utc)

        AprovarAlunoUseCase(repository).execute(4, "ativado")

        validade = repository.chamada["validade_acesso"]
        self.assertIsNotNone(validade)
        self.assertEqual(validade.date(), somar_meses(antes, 6).date())

    def test_outros_status_nao_alteram_a_validade(self):
        for status in ("inativado", "pendente", "analise_renovacao"):
            with self.subTest(status=status):
                repository = FakeApprovalRepository()

                AprovarAlunoUseCase(repository).execute(4, status)

                self.assertIsNone(repository.chamada["validade_acesso"])

    def test_somar_meses_ajusta_o_fim_do_mes(self):
        self.assertEqual(somar_meses(datetime(2026, 8, 31), 6), datetime(2027, 2, 28))
        self.assertEqual(somar_meses(datetime(2027, 8, 31), 6), datetime(2028, 2, 29))
        self.assertEqual(somar_meses(datetime(2026, 10, 23), 6), datetime(2027, 4, 23))


if __name__ == "__main__":
    unittest.main()
