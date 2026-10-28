"""Testes unitários puros dos DTOs de rota complementar: sem banco, rede ou relógio."""

import unittest
from datetime import time

from pydantic import ValidationError

from src.modulos.rotas.application.dtos.rota_complementar_dto import (
    AtualizarRotaComplementarDTO,
    CriarRotaComplementarDTO,
    OperacaoRotaComplementarResponseDTO,
    RotaComplementarResponseDTO,
)


def valido(**alteracoes):
    dados = {
        "nome": "Van 2 - Bairro Novo",
        "horario_saida": "06:00",
        "horario_retorno": "17:40",
        "ponto_conexao": "Trevo do Bairro Novo",
        "rota_principal_id": 1,
    }
    dados.update(alteracoes)
    return dados


def campos_com_erro(excecao: ValidationError) -> set[str]:
    return {".".join(str(p) for p in erro["loc"]) for erro in excecao.errors()}


class CriarRotaComplementarDTOTest(unittest.TestCase):
    def test_dados_validos_sao_convertidos(self):
        dto = CriarRotaComplementarDTO(**valido(nome="  Van 2  ", ponto_conexao=" Posto "))

        self.assertEqual(dto.nome, "Van 2")
        self.assertEqual(dto.ponto_conexao, "Posto")
        self.assertEqual(dto.horario_saida, time(6, 0))
        self.assertEqual(dto.horario_retorno, time(17, 40))
        self.assertEqual(dto.rota_principal_id, 1)

    def test_horarios_validos_nos_limites(self):
        # A ordem saída < retorno é regra do use case; o DTO só valida o formato.
        for campo in ("horario_saida", "horario_retorno"):
            for texto, esperado in (("00:00", time(0, 0)), ("23:59", time(23, 59)), (" 06:30 ", time(6, 30))):
                with self.subTest(campo=campo, horario=texto):
                    dto = CriarRotaComplementarDTO(**valido(**{campo: texto}))
                    self.assertEqual(getattr(dto, campo), esperado)

    def test_objeto_time_e_aceito_e_perde_segundos(self):
        dto = CriarRotaComplementarDTO(
            **valido(horario_saida=time(6, 30, 45, 10), horario_retorno=time(17, 40, 5))
        )

        self.assertEqual(dto.horario_saida, time(6, 30))
        self.assertEqual(dto.horario_retorno, time(17, 40))

    def test_horarios_invalidos_sao_recusados(self):
        invalidos = [
            "24:00", "6:30", "06:60", "", "   ", "06-30", "06:30:00", "0630", "ab:cd",
            "０６:３０",  # dígitos de largura total (não ASCII)
            "٠٦:٣٠",  # dígitos arábico-índicos
            630, 6.5, True, [], {},
        ]
        for campo in ("horario_saida", "horario_retorno"):
            for valor in invalidos:
                with self.subTest(campo=campo, horario=valor):
                    with self.assertRaises(ValidationError) as ctx:
                        CriarRotaComplementarDTO(**valido(**{campo: valor}))
                    self.assertEqual(campos_com_erro(ctx.exception), {campo})

    def test_horario_ausente_ou_nulo_e_recusado(self):
        for campo in ("horario_saida", "horario_retorno"):
            dados = valido()
            del dados[campo]
            for entrada in (dados, valido(**{campo: None})):
                with self.subTest(campo=campo, entrada=entrada):
                    with self.assertRaises(ValidationError) as ctx:
                        CriarRotaComplementarDTO(**entrada)
                    self.assertEqual(campos_com_erro(ctx.exception), {campo})

    def test_lista_de_horarios_e_recusada(self):
        # Um único horário de saída e um de retorno por complementar (#208, item 4)
        for campo in ("horario_saida", "horario_retorno"):
            with self.subTest(campo=campo):
                with self.assertRaises(ValidationError) as ctx:
                    CriarRotaComplementarDTO(**valido(**{campo: ["06:00", "07:00"]}))
                self.assertEqual(campos_com_erro(ctx.exception), {campo})

    def test_texto_vazio_so_espacos_ou_nulo_e_recusado_em_nome_e_ponto(self):
        for campo in ("nome", "ponto_conexao"):
            for valor in ("", "   ", "\t\n", None, 10, ["x"]):
                with self.subTest(campo=campo, valor=valor):
                    with self.assertRaises(ValidationError) as ctx:
                        CriarRotaComplementarDTO(**valido(**{campo: valor}))
                    self.assertEqual(campos_com_erro(ctx.exception), {campo})

    def test_limite_de_150_caracteres_apos_o_strip(self):
        for campo in ("nome", "ponto_conexao"):
            with self.subTest(campo=campo):
                ok = CriarRotaComplementarDTO(**valido(**{campo: " " + "a" * 150 + " "}))
                self.assertEqual(len(getattr(ok, campo)), 150)
                with self.assertRaises(ValidationError) as ctx:
                    CriarRotaComplementarDTO(**valido(**{campo: "a" * 151}))
                self.assertEqual(campos_com_erro(ctx.exception), {campo})

    def test_nul_e_recusado_em_nome_e_ponto_como_texto_invalido(self):
        for campo in ("nome", "ponto_conexao"):
            for valor in ("a\x00b", "\x00", "abc\x00", "\x00abc", " \x00 "):
                with self.subTest(campo=campo, valor=valor):
                    with self.assertRaises(ValidationError) as ctx:
                        CriarRotaComplementarDTO(**valido(**{campo: valor}))
                    self.assertEqual(campos_com_erro(ctx.exception), {campo})
                    self.assertEqual([e["type"] for e in ctx.exception.errors()], ["string_type"])

    def test_rota_principal_id_invalido_e_recusado(self):
        for valor in (0, -1, True, False, "1", "abc", None, 1.5, [1]):
            with self.subTest(valor=valor):
                with self.assertRaises(ValidationError) as ctx:
                    CriarRotaComplementarDTO(**valido(rota_principal_id=valor))
                self.assertEqual(campos_com_erro(ctx.exception), {"rota_principal_id"})

    def test_campos_obrigatorios_ausentes(self):
        with self.assertRaises(ValidationError) as ctx:
            CriarRotaComplementarDTO()

        self.assertEqual(
            campos_com_erro(ctx.exception),
            {"nome", "horario_saida", "horario_retorno", "ponto_conexao", "rota_principal_id"},
        )

    def test_campos_extras_sao_rejeitados(self):
        for extra in ("ativo", "id", "x"):
            with self.subTest(extra=extra):
                with self.assertRaises(ValidationError) as ctx:
                    CriarRotaComplementarDTO(**valido(**{extra: "1"}))
                self.assertEqual(campos_com_erro(ctx.exception), {extra})


class AtualizarRotaComplementarDTOTest(unittest.TestCase):
    def test_patch_vazio_nao_marca_nenhum_campo(self):
        self.assertEqual(AtualizarRotaComplementarDTO().model_fields_set, set())

    def test_cada_campo_isolado_marca_somente_ele(self):
        casos = {
            "nome": "Van 3",
            "horario_saida": "05:45",
            "horario_retorno": "18:10",
            "ponto_conexao": "Posto Central",
            "rota_principal_id": 2,
        }
        for campo, valor in casos.items():
            with self.subTest(campo=campo):
                dto = AtualizarRotaComplementarDTO(**{campo: valor})
                self.assertEqual(dto.model_fields_set, {campo})
                self.assertIsNotNone(getattr(dto, campo))

    def test_horario_convertido_no_patch(self):
        self.assertEqual(
            AtualizarRotaComplementarDTO(horario_saida="23:59").horario_saida, time(23, 59)
        )
        self.assertEqual(
            AtualizarRotaComplementarDTO(horario_retorno="17:45").horario_retorno, time(17, 45)
        )

    def test_nulo_explicito_e_marcado_como_enviado_para_o_use_case_rejeitar(self):
        for campo in ("nome", "horario_saida", "horario_retorno", "ponto_conexao", "rota_principal_id"):
            with self.subTest(campo=campo):
                dto = AtualizarRotaComplementarDTO(**{campo: None})
                self.assertEqual(dto.model_fields_set, {campo})
                self.assertIsNone(getattr(dto, campo))

    def test_valores_invalidos_sao_recusados_por_campo(self):
        casos = [
            ("nome", ""), ("nome", "   "), ("nome", "a" * 151), ("nome", 1),
            ("ponto_conexao", ""), ("ponto_conexao", "  "), ("ponto_conexao", "a" * 151),
            ("horario_saida", "24:00"), ("horario_saida", "6:30"), ("horario_saida", ""),
            ("horario_saida", "０６:３０"), ("horario_saida", 630),
            ("horario_retorno", "24:00"), ("horario_retorno", "17h40"), ("horario_retorno", ""),
            ("rota_principal_id", 0), ("rota_principal_id", -3), ("rota_principal_id", True),
            ("rota_principal_id", "1"),
        ]
        for campo, valor in casos:
            with self.subTest(campo=campo, valor=valor):
                with self.assertRaises(ValidationError) as ctx:
                    AtualizarRotaComplementarDTO(**{campo: valor})
                self.assertEqual(campos_com_erro(ctx.exception), {campo})

    def test_nul_e_recusado_em_nome_e_ponto_no_patch(self):
        for campo in ("nome", "ponto_conexao"):
            with self.subTest(campo=campo):
                with self.assertRaises(ValidationError) as ctx:
                    AtualizarRotaComplementarDTO(**{campo: "a\x00b"})
                self.assertEqual(campos_com_erro(ctx.exception), {campo})

    def test_campos_extras_sao_rejeitados(self):
        with self.assertRaises(ValidationError):
            AtualizarRotaComplementarDTO(ativo=False)


class RespostaDTOTest(unittest.TestCase):
    def test_resposta_tem_o_contrato_esperado(self):
        dados = {
            "id": 1, "nome": "Van", "horario_saida": "06:00", "horario_retorno": "17:40",
            "ponto_conexao": "Trevo",
            "ativo": True, "rota_principal": {"id": 2, "nome": "Linha", "ativo": True},
        }

        self.assertEqual(RotaComplementarResponseDTO(**dados).model_dump(), dados)
        with self.assertRaises(ValidationError):
            RotaComplementarResponseDTO(**dados, extra=1)

    def test_operacao_tem_sucesso_por_padrao_e_data_opcional(self):
        resposta = OperacaoRotaComplementarResponseDTO(message="ok")

        self.assertEqual(resposta.model_dump(), {"success": True, "message": "ok", "data": None})
