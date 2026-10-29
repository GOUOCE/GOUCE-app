import unittest
from types import SimpleNamespace

from src.modulos.usuarios.application.dtos.renovacao_vinculo_dto import (
    RenovacaoVinculoDTO,
)
from src.modulos.usuarios.application.use_cases.renovar_vinculo_use_case import (
    RenovacaoJaEmAnaliseError,
    RenovarVinculoUseCase,
)
from src.shared.enums.status_cadastro_enum import StatusCadastroEnum
from src.modulos.usuarios.application.use_cases.validar_vinculos_aluno_use_case import VinculoAlunoValidationError


class FakeRenewalRepository:
    def __init__(self, status_cadastro="ativado"):
        self.usuario = SimpleNamespace(id=7, email="aluno@example.com")
        self.aluno = SimpleNamespace(
            aluno_id=7,
            id_comprovante_residencia=None,
            status_cadastro=status_cadastro,
        )
        self.update_call = None
        self.bairro_ativo = True
        self.faculdade_ativa = True

    def buscar_com_detalhes_por_id(self, aluno_id):
        return self.usuario, self.aluno

    def bairro_ativo_existe(self, bairro_id):
        return bairro_id == 1 and self.bairro_ativo

    def faculdade_ativa_existe(self, faculdade_id):
        return faculdade_id == 1 and self.faculdade_ativa

    def atualizar_dados_renovacao(self, **kwargs):
        self.update_call = kwargs
        return self.aluno


class FakeSaveFileUseCase:
    def __init__(self):
        self.salvos = []

    def execute(self, conteudo, nome, content_type):
        self.salvos.append(nome)
        return SimpleNamespace(id=f"id-{nome}")


def criar_dto():
    return RenovacaoVinculoDTO(
        raca="Pardo",
        nome="Maria da Silva",
        identificacao_sexual="Bissexual",
        identificacao_genero="Mulher",
        transgenero="Não",
        tem_filhos=False,
        telefone="85999990000",
        bairro_id="1",
        faculdade_id=1,
        curso="Engenharia de Software",
        periodo_ingresso="2024.1",
        turno_curso="Noturno",
        semestre_atual=4,
    )


class RenovacaoVinculoUseCaseTest(unittest.TestCase):
    def test_nao_salva_documentos_nem_renova_com_vinculo_inativo(self):
        for atributo in ("bairro_ativo", "faculdade_ativa"):
            with self.subTest(atributo=atributo):
                repository = FakeRenewalRepository()
                setattr(repository, atributo, False)
                salvar = FakeSaveFileUseCase()
                with self.assertRaises(VinculoAlunoValidationError):
                    RenovarVinculoUseCase(repository, salvar).execute(
                        7, criar_dto(), ("matricula.pdf", "application/pdf", b"matricula"), None,
                    )
                self.assertEqual(salvar.salvos, [])
                self.assertIsNone(repository.update_call)

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
            bairro_id="1",
            faculdade_id=1,
            curso="Engenharia de Software",

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
        self.assertEqual(repository.update_call["dados"].faculdade_id, 1)
        self.assertEqual(repository.update_call["dados"].nome, "Maria da Silva")
        self.assertEqual(repository.update_call["id_foto_aluno"], "id-foto.png")
        self.assertEqual(repository.update_call["novo_status"], "analise_renovacao")
        self.assertEqual(repository.update_call["id_comprovante_matricula"], "id-matricula.pdf")
        self.assertEqual(repository.update_call["id_comprovante_residencia"], "id-residencia.pdf")

    def test_recusa_nova_renovacao_enquanto_a_anterior_esta_em_analise(self):
        # BUG-HU028-API-003 / #133: o segundo envio substituía o comprovante em análise.
        for status in ("analise_renovacao", StatusCadastroEnum.ANALISE_RENOVACAO, "pendente"):
            with self.subTest(status=status):
                repository = FakeRenewalRepository(status_cadastro=status)
                salvar = FakeSaveFileUseCase()
                use_case = RenovarVinculoUseCase(repository, salvar)

                with self.assertRaises(RenovacaoJaEmAnaliseError):
                    use_case.execute(
                        7,
                        criar_dto(),
                        ("matricula.pdf", "application/pdf", b"matricula"),
                        None,
                    )

                self.assertIsNone(repository.update_call)
                self.assertEqual(salvar.salvos, [])


if __name__ == "__main__":
    unittest.main()
