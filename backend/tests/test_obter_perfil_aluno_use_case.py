import unittest
from datetime import datetime, timezone
from types import SimpleNamespace

from src.modulos.usuarios.application.use_cases.obter_perfil_aluno_use_case import (
    ObterPerfilAlunoUseCase,
)


class FakeProfileRepository:
    def __init__(self, transgenero):
        self.usuario = SimpleNamespace(
            id=4,
            nome_completo="Maria da Silva",
            email="maria@example.com",
            telefone="85999990000",
            data_criacao=datetime(2026, 10, 1, tzinfo=timezone.utc),
        )
        self.aluno = SimpleNamespace(
            status_cadastro="ativado",
            faculdade_id=1,
            faculdade_rel=None,
            bairro_id="Centro",
            curso="Engenharia de Software",
            semestre_atual=3,
            periodo_ingresso="2024.1",
            turno_curso="Vespertino",
            data_nascimento=20020515,
            identificacao_genero="Mulher",
            transgenero=transgenero,
            raca="Parda",
            identificacao_sexual="Bissexual",
            tem_filhos=False,
            id_foto_aluno=None,
            validade_acesso=None,
            motivo_reprovacao=None,
            id_comprovante_matricula=None,
            id_comprovante_residencia=None,
        )

    def buscar_com_detalhes_por_id(self, user_id):
        return self.usuario, self.aluno


class ObterPerfilAlunoUseCaseTest(unittest.TestCase):
    def test_devolve_a_resposta_de_transgenero_salva_no_cadastro(self):
        # A renovação (HU-028) preenche o passo 2 com o perfil; sem o campo, a tela marcava "Não".
        for resposta in ("Sim", "Não", "Prefiro não dizer"):
            with self.subTest(resposta=resposta):
                perfil = ObterPerfilAlunoUseCase(FakeProfileRepository(resposta)).execute(4)

                self.assertEqual(perfil.transgenero.value, resposta)


if __name__ == "__main__":
    unittest.main()
