import unittest
from types import SimpleNamespace

from src.modulos.usuarios.application.dtos.renovacao_vinculo_dto import (
    RenovacaoVinculoDTO,
)
from src.modulos.usuarios.application.use_cases.renovar_vinculo_use_case import (
    RenovarVinculoUseCase,
)
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum


class FakeRenewalRepository:
    def __init__(self):
        self.usuario = SimpleNamespace(id=7, email="aluno@example.com")
        self.aluno = SimpleNamespace(aluno_id=7)
        self.update_call = None

    def buscar_com_detalhes_por_id(self, aluno_id):
        return self.usuario, self.aluno

    def atualizar_dados_renovacao(self, **kwargs):
        self.update_call = kwargs
        return self.aluno


class FakeSaveFileUseCase:
    def execute(self, conteudo, nome, content_type):
        return SimpleNamespace(id=f"id-{nome}")


class RenovacaoVinculoUseCaseTest(unittest.TestCase):
    def test_atualiza_aluno_autenticado_com_campus_e_status_de_renovacao(self):
        repository = FakeRenewalRepository()
        use_case = RenovarVinculoUseCase(repository, FakeSaveFileUseCase())
        dto = RenovacaoVinculoDTO(
            raca="Pardo",
            nome="Maria da Silva",
            identificacao_sexual="Bissexual",
            identificacao_genero="Mulher",
            transgenero="Não",
            tem_filhos=False,
            telefone="85999990000",
            bairro_id="Centro",
            faculdade_id="UFC",
            curso="Engenharia de Software",
            campus="Quixadá",
            periodo_ingresso="2024.1",
            turno_curso="Noturno",
            semestre_atual=4,
        )

        resposta = use_case.execute(
            7,
            dto,
            ("matricula.pdf", "application/pdf", b"matricula"),
            ("residencia.pdf", "application/pdf", b"residencia"),
            ("foto.png", "image/png", b"foto"),
        )

        self.assertEqual(resposta.aluno_id, 7)
        self.assertEqual(resposta.status_cadastro, StatusCadastroEnum.ANALISE_RENOVACAO)
        self.assertEqual(repository.update_call["aluno_id"], 7)
        self.assertEqual(repository.update_call["dados"].campus, "Quixadá")
        self.assertEqual(repository.update_call["dados"].nome, "Maria da Silva")
        self.assertEqual(repository.update_call["id_foto_aluno"], "id-foto.png")
        self.assertEqual(repository.update_call["novo_status"], "analise_renovacao")
        self.assertEqual(repository.update_call["id_comprovante_matricula"], "id-matricula.pdf")
        self.assertEqual(repository.update_call["id_comprovante_residencia"], "id-residencia.pdf")


if __name__ == "__main__":
    unittest.main()