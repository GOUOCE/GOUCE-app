import unittest
from datetime import time

from pydantic import ValidationError

from tests.rota_principal_support import dados_rota

from src.modulos.rotas.application.dtos.rota_principal_dto import (
    AtualizarRotaPrincipalDTO,
    CriarRotaPrincipalDTO,
    formatar_horario,
    interpretar_horario,
)


def campos_com_erro(excecao: ValidationError) -> set[str]:
    return {str(e["loc"][0]) for e in excecao.exception.errors()}


class CriarRotaPrincipalDTOTest(unittest.TestCase):
    def test_aceita_payload_valido_e_converte_horarios(self):
        dto = CriarRotaPrincipalDTO(**dados_rota(nome="  Rota X  "))

        self.assertEqual(dto.nome, "Rota X")
        self.assertEqual(dto.horario_saida, time(6, 30))
        self.assertEqual(dto.horario_retorno, time(17, 30))

    def test_criterio_7_campos_obrigatorios_ausentes(self):
        with self.assertRaises(ValidationError) as ctx:
            CriarRotaPrincipalDTO()

        self.assertEqual(
            campos_com_erro(ctx),
            {"nome", "horario_saida", "horario_retorno", "bairros_ids",
             "faculdades_ida_ids", "faculdades_volta_ids"},
        )

    def test_criterio_7_nome_vazio_e_listas_vazias(self):
        with self.assertRaises(ValidationError) as ctx:
            CriarRotaPrincipalDTO(
                **dados_rota(nome="   ", bairros_ids=[], faculdades_ida_ids=[], faculdades_volta_ids=[])
            )

        self.assertEqual(
            campos_com_erro(ctx),
            {"nome", "bairros_ids", "faculdades_ida_ids", "faculdades_volta_ids"},
        )

    def test_horario_aceita_somente_hh_mm(self):
        for invalido in ("6:30", "06:60", "24:00", "06:30:00", "abc", "", 630, None, True):
            with self.subTest(valor=invalido):
                with self.assertRaises(ValidationError) as ctx:
                    CriarRotaPrincipalDTO(**dados_rota(horario_saida=invalido))
                self.assertEqual(campos_com_erro(ctx), {"horario_saida"})

    def test_horario_nas_fronteiras_do_dia(self):
        dto = CriarRotaPrincipalDTO(**dados_rota(horario_saida="00:00", horario_retorno="23:59"))

        self.assertEqual(formatar_horario(dto.horario_saida), "00:00")
        self.assertEqual(formatar_horario(dto.horario_retorno), "23:59")

    def test_ids_devem_ser_inteiros_positivos(self):
        for invalido in ([0], [-1], ["1"], [True], [1.5], [None]):
            with self.subTest(valor=invalido):
                with self.assertRaises(ValidationError) as ctx:
                    CriarRotaPrincipalDTO(**dados_rota(bairros_ids=invalido))
                self.assertEqual(campos_com_erro(ctx), {"bairros_ids"})

    def test_nao_aceita_campos_extras(self):
        with self.assertRaises(ValidationError) as ctx:
            CriarRotaPrincipalDTO(**dados_rota(ativo=False))

        self.assertEqual(campos_com_erro(ctx), {"ativo"})

    def test_interpretar_horario_rejeita_tipos_invalidos(self):
        with self.assertRaises(ValueError):
            interpretar_horario(["06:30"])


class AtualizarRotaPrincipalDTOTest(unittest.TestCase):
    def test_todos_os_campos_sao_opcionais_e_rastreados(self):
        dto = AtualizarRotaPrincipalDTO(horario_saida="06:00")

        self.assertEqual(dto.model_fields_set, {"horario_saida"})
        self.assertEqual(dto.horario_saida, time(6, 0))

    def test_listas_enviadas_nao_podem_ser_vazias(self):
        for campo in ("bairros_ids", "faculdades_ida_ids", "faculdades_volta_ids"):
            with self.subTest(campo=campo):
                with self.assertRaises(ValidationError) as ctx:
                    AtualizarRotaPrincipalDTO(**{campo: []})
                self.assertEqual(campos_com_erro(ctx), {campo})

    def test_nome_vazio_e_horario_invalido_sao_recusados(self):
        with self.assertRaises(ValidationError) as ctx:
            AtualizarRotaPrincipalDTO(nome="  ", horario_retorno="7h")

        self.assertEqual(campos_com_erro(ctx), {"nome", "horario_retorno"})

    def test_nao_aceita_campos_extras(self):
        with self.assertRaises(ValidationError):
            AtualizarRotaPrincipalDTO(ativo=True)


CAMPOS_LISTA = ("bairros_ids", "faculdades_ida_ids", "faculdades_volta_ids")
CAMPOS_ROTA = ("nome", "horario_saida", "horario_retorno", *CAMPOS_LISTA)


# Dígitos que não são ASCII (\d do Python os aceitaria): árabe-índico, devanágari e fullwidth.
HORARIOS_COM_DIGITOS_NAO_ASCII = (
    "0٦:30", "06:3٠", "٠٦:٣٠",
    "0६:30", "06:3०", "०६:३०",
    "0６:30", "06:3０", "０６:３０", "０６：３０",
)


class HorarioDTOTest(unittest.TestCase):
    def test_digitos_nao_ascii_sao_recusados_nos_dois_horarios(self):
        for invalido in HORARIOS_COM_DIGITOS_NAO_ASCII:
            for campo in ("horario_saida", "horario_retorno"):
                with self.subTest(campo=campo, valor=invalido):
                    with self.assertRaises(ValidationError) as ctx:
                        CriarRotaPrincipalDTO(**dados_rota(**{campo: invalido}))
                    self.assertEqual(campos_com_erro(ctx), {campo})
                    with self.assertRaises(ValidationError):
                        AtualizarRotaPrincipalDTO(**{campo: invalido})

    def test_interpretar_horario_recusa_digitos_nao_ascii(self):
        for invalido in HORARIOS_COM_DIGITOS_NAO_ASCII:
            with self.subTest(valor=invalido):
                with self.assertRaises(ValueError):
                    interpretar_horario(invalido)

    def test_horarios_invalidos_adicionais(self):
        invalidos = ("06: 30", "06 :30", "0630", "06.30", "06:3", " ", "\t", 6.5, [], {})
        for invalido in invalidos:
            for campo in ("horario_saida", "horario_retorno"):
                with self.subTest(campo=campo, valor=invalido):
                    with self.assertRaises(ValidationError) as ctx:
                        CriarRotaPrincipalDTO(**dados_rota(**{campo: invalido}))
                    self.assertEqual(campos_com_erro(ctx), {campo})

    def test_espacos_nas_pontas_sao_removidos_antes_de_validar(self):
        dto = CriarRotaPrincipalDTO(**dados_rota(horario_saida=" 06:30 ", horario_retorno="\t17:30"))

        self.assertEqual((dto.horario_saida, dto.horario_retorno), (time(6, 30), time(17, 30)))

    def test_interpretar_horario_aceita_time_descartando_segundos(self):
        self.assertEqual(interpretar_horario(time(6, 30, 45, 5)), time(6, 30))

    def test_formatar_horario_sempre_com_dois_digitos(self):
        self.assertEqual(formatar_horario(time(0, 0)), "00:00")
        self.assertEqual(formatar_horario(time(9, 5)), "09:05")
        self.assertEqual(formatar_horario(time(23, 59)), "23:59")

    def test_ordem_entre_horarios_nao_e_regra_do_dto(self):
        # A regra "retorno > saída" é do use case (testada lá); o DTO só valida formato.
        dto = CriarRotaPrincipalDTO(**dados_rota(horario_saida="17:30", horario_retorno="17:30"))

        self.assertEqual(dto.horario_saida, dto.horario_retorno)


class NomeDTOTest(unittest.TestCase):
    def test_nome_no_limite_de_150_caracteres_e_aceito(self):
        self.assertEqual(len(CriarRotaPrincipalDTO(**dados_rota(nome="a" * 150)).nome), 150)

    def test_nome_longo_demais_vazio_so_espacos_ou_de_tipo_errado(self):
        for invalido in ("a" * 151, "", "   ", "\t\n", 123, ["Rota"], True):
            with self.subTest(valor=invalido):
                with self.assertRaises(ValidationError) as ctx:
                    CriarRotaPrincipalDTO(**dados_rota(nome=invalido))
                self.assertEqual(campos_com_erro(ctx), {"nome"})

    def test_espacos_nas_pontas_nao_contam_para_o_limite(self):
        dto = CriarRotaPrincipalDTO(**dados_rota(nome="  " + "a" * 150 + "  "))

        self.assertEqual(len(dto.nome), 150)

    def test_nul_no_nome_e_recusado_como_texto_invalido(self):
        for valor in ("a\x00b", "\x00", "abc\x00", "\x00abc", " \x00 "):
            with self.subTest(valor=valor):
                with self.assertRaises(ValidationError) as ctx:
                    CriarRotaPrincipalDTO(**dados_rota(nome=valor))
                self.assertEqual(campos_com_erro(ctx), {"nome"})
                self.assertEqual([e["type"] for e in ctx.exception.errors()], ["string_type"])

    def test_patch_com_nul_no_nome_e_recusado(self):
        with self.assertRaises(ValidationError) as ctx:
            AtualizarRotaPrincipalDTO(nome="a\x00b")
        self.assertEqual(campos_com_erro(ctx), {"nome"})

    def test_patch_com_nome_longo_demais_ou_vazio(self):
        for invalido in ("a" * 151, "", "   "):
            with self.subTest(valor=invalido):
                with self.assertRaises(ValidationError) as ctx:
                    AtualizarRotaPrincipalDTO(nome=invalido)
                self.assertEqual(campos_com_erro(ctx), {"nome"})


class ListasDTOTest(unittest.TestCase):
    def test_listas_invalidas_em_cada_campo(self):
        invalidas = ([], [0], [-1], [True], [False], ["1"], [1.0], [None], [[1]], [1, 0], [1, "2"], "1", 1, None)
        for campo in CAMPOS_LISTA:
            for invalida in invalidas:
                with self.subTest(campo=campo, valor=invalida):
                    with self.assertRaises(ValidationError) as ctx:
                        CriarRotaPrincipalDTO(**dados_rota(**{campo: invalida}))
                    self.assertEqual(campos_com_erro(ctx), {campo})

    def test_patch_recusa_as_mesmas_listas_invalidas(self):
        for campo in CAMPOS_LISTA:
            for invalida in ([], [0], [-1], [True], ["1"], [1.0], [None]):
                with self.subTest(campo=campo, valor=invalida):
                    with self.assertRaises(ValidationError) as ctx:
                        AtualizarRotaPrincipalDTO(**{campo: invalida})
                    self.assertEqual(campos_com_erro(ctx), {campo})

    def test_listas_validas_preservam_a_ordem_e_aceitam_duplicatas(self):
        # Duplicatas são recusadas pelo use case (com mensagem por campo), não pelo DTO.
        for campo in CAMPOS_LISTA:
            with self.subTest(campo=campo):
                dto = CriarRotaPrincipalDTO(**dados_rota(**{campo: [3, 1, 3]}))
                self.assertEqual(getattr(dto, campo), [3, 1, 3])


class CamposExtrasDTOTest(unittest.TestCase):
    def test_campos_extras_sao_rejeitados_na_criacao_e_na_edicao(self):
        for extra in ("ativo", "id", "pontos_ids", "bairros", "data_criacao"):
            with self.subTest(extra=extra):
                with self.assertRaises(ValidationError) as ctx:
                    CriarRotaPrincipalDTO(**dados_rota(**{extra: 1}))
                self.assertEqual(campos_com_erro(ctx), {extra})
                with self.assertRaises(ValidationError) as ctx:
                    AtualizarRotaPrincipalDTO(**{extra: 1})
                self.assertEqual(campos_com_erro(ctx), {extra})


class PatchParcialDTOTest(unittest.TestCase):
    def test_patch_vazio_nao_marca_nenhum_campo(self):
        dto = AtualizarRotaPrincipalDTO()

        self.assertEqual(dto.model_fields_set, set())

    def test_patch_com_cada_campo_isolado_marca_somente_ele(self):
        valores = {
            "nome": "Novo", "horario_saida": "05:00", "horario_retorno": "20:00",
            "bairros_ids": [1], "faculdades_ida_ids": [2], "faculdades_volta_ids": [3],
        }
        for campo in CAMPOS_ROTA:
            with self.subTest(campo=campo):
                dto = AtualizarRotaPrincipalDTO(**{campo: valores[campo]})
                self.assertEqual(dto.model_fields_set, {campo})
                outros = [c for c in CAMPOS_ROTA if c != campo]
                self.assertTrue(all(getattr(dto, c) is None for c in outros))

    def test_patch_com_nulo_explicito_continua_marcado(self):
        # O use case é quem recusa o nulo enviado; o DTO preserva a intenção do cliente.
        dto = AtualizarRotaPrincipalDTO(nome=None)

        self.assertEqual(dto.model_fields_set, {"nome"})
        self.assertIsNone(dto.nome)

    def test_patch_com_todos_os_campos_converte_tipos(self):
        dto = AtualizarRotaPrincipalDTO(
            nome=" X ", horario_saida="05:00", horario_retorno="20:00",
            bairros_ids=[1], faculdades_ida_ids=[2], faculdades_volta_ids=[3],
        )

        self.assertEqual(dto.nome, "X")
        self.assertEqual((dto.horario_saida, dto.horario_retorno), (time(5, 0), time(20, 0)))


if __name__ == "__main__":
    unittest.main()
