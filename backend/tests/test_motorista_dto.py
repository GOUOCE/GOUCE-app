import os
import unittest

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://test:test@localhost:5432/test",
)

from pydantic import ValidationError

from src.modulos.motoristas.application.dtos.motorista_dto import (
    AtualizarMotoristaDTO,
    CriarMotoristaDTO,
    MotoristaResponseDTO,
)
from src.modulos.motoristas.model.entities.motorista import MotoristaORM
from src.shared.security.lgpd_encryption import (
    EncryptedString,
    hash_telefone,
    normalizar_telefone,
)


class MotoristaDTOTest(unittest.TestCase):
    def test_cadastro_aceita_nome_e_telefone(self):
        dto = CriarMotoristaDTO(
            nome="Maria da Silva",
            telefone="85999990000",
        )

        self.assertEqual(dto.nome, "Maria da Silva")
        self.assertEqual(dto.telefone, "85999990000")

    def test_cadastro_remove_espacos_externos(self):
        dto = CriarMotoristaDTO(
            nome="  Maria da Silva  ",
            telefone=" 85999990000 ",
        )

        self.assertEqual(dto.nome, "Maria da Silva")
        self.assertEqual(dto.telefone, "85999990000")

    def test_cadastro_exige_nome(self):
        with self.assertRaises(ValidationError):
            CriarMotoristaDTO(telefone="85999990000")

    def test_cadastro_exige_telefone(self):
        with self.assertRaises(ValidationError):
            CriarMotoristaDTO(nome="Maria da Silva")

    def test_cadastro_rejeita_valores_vazios(self):
        with self.assertRaises(ValidationError):
            CriarMotoristaDTO(nome="   ", telefone="85999990000")

        with self.assertRaises(ValidationError):
            CriarMotoristaDTO(nome="Maria da Silva", telefone="   ")

    def test_cadastro_rejeita_telefone_sem_digitos(self):
        with self.assertRaises(ValidationError):
            CriarMotoristaDTO(nome="Maria da Silva", telefone="abc")

    def test_cadastro_aceita_telefone_formatado_com_digitos(self):
        dto = CriarMotoristaDTO(
            nome="Maria da Silva",
            telefone="(85) 99999-0000",
        )

        self.assertEqual(dto.telefone, "(85) 99999-0000")

    def test_cadastro_rejeita_limites_de_tamanho(self):
        with self.assertRaises(ValidationError):
            CriarMotoristaDTO(nome="A" * 151, telefone="85999990000")

        with self.assertRaises(ValidationError):
            CriarMotoristaDTO(nome="Maria da Silva", telefone="1" * 21)

    def test_cadastro_rejeita_tipos_invalidos(self):
        with self.assertRaises(ValidationError):
            CriarMotoristaDTO(nome=123, telefone="85999990000")

        with self.assertRaises(ValidationError):
            CriarMotoristaDTO(nome="Maria da Silva", telefone=85999990000)

    def test_cadastro_rejeita_campos_nao_previstos(self):
        with self.assertRaises(ValidationError):
            CriarMotoristaDTO(
                nome="Maria da Silva",
                telefone="85999990000",
                cpf="12345678909",
            )

    def test_edicao_aceita_um_campo(self):
        dto = AtualizarMotoristaDTO(telefone="85988880000")

        self.assertIsNone(dto.nome)
        self.assertEqual(dto.telefone, "85988880000")

    def test_edicao_nao_exige_campo_nesta_camada(self):
        dto = AtualizarMotoristaDTO()

        self.assertIsNone(dto.nome)
        self.assertIsNone(dto.telefone)

    def test_edicao_rejeita_valores_vazios(self):
        with self.assertRaises(ValidationError):
            AtualizarMotoristaDTO(nome="   ")

        with self.assertRaises(ValidationError):
            AtualizarMotoristaDTO(telefone="   ")

    def test_edicao_rejeita_telefone_sem_digitos(self):
        with self.assertRaises(ValidationError):
            AtualizarMotoristaDTO(telefone="abc")

    def test_edicao_rejeita_limites_de_tamanho(self):
        with self.assertRaises(ValidationError):
            AtualizarMotoristaDTO(nome="A" * 151)

        with self.assertRaises(ValidationError):
            AtualizarMotoristaDTO(telefone="1" * 21)

    def test_edicao_rejeita_tipos_invalidos(self):
        with self.assertRaises(ValidationError):
            AtualizarMotoristaDTO(nome=123)

        with self.assertRaises(ValidationError):
            AtualizarMotoristaDTO(telefone=85999990000)

    def test_edicao_rejeita_campos_nao_previstos(self):
        with self.assertRaises(ValidationError):
            AtualizarMotoristaDTO(cnh="123456789")

    def test_resposta_expoe_somente_o_contrato_publico(self):
        dto = MotoristaResponseDTO(
            id=1,
            nome="Maria da Silva",
            telefone="85999990000",
            ativo=True,
        )

        self.assertEqual(
            set(dto.model_dump()),
            {"id", "nome", "telefone", "ativo"},
        )
        self.assertEqual(dto.id, 1)
        self.assertEqual(dto.nome, "Maria da Silva")
        self.assertTrue(dto.ativo)

    def test_resposta_rejeita_informacoes_internas(self):
        with self.assertRaises(ValidationError):
            MotoristaResponseDTO(
                id=1,
                nome="Maria da Silva",
                telefone="85999990000",
                ativo=True,
                data_criacao="2026-10-18T12:00:00Z",
            )


class MotoristaORMTest(unittest.TestCase):
    def test_nome_e_telefone_usam_encrypted_string(self):
        colunas = MotoristaORM.__table__.c

        self.assertIsInstance(colunas.nome_completo.type, EncryptedString)
        self.assertIsInstance(colunas.telefone.type, EncryptedString)

    def test_telefone_hash_e_um_indice_unico_nao_exposto(self):
        coluna = MotoristaORM.__table__.c.telefone_hash

        self.assertEqual(coluna.type.length, 64)
        self.assertTrue(coluna.unique)
        self.assertTrue(coluna.index)

    def test_telefone_e_normalizado_por_digitos_para_o_hmac(self):
        formatado = "(85) 99999-0000"
        numerico = "85999990000"

        self.assertEqual(normalizar_telefone(formatado), numerico)
        self.assertEqual(hash_telefone(formatado), hash_telefone(numerico))
        self.assertNotEqual(hash_telefone(formatado), numerico)

    def test_mapeamento_do_nome_e_explicito_no_orm(self):
        colunas = set(MotoristaORM.__table__.columns.keys())

        self.assertIn("nome_completo", colunas)
        self.assertNotIn("nome", colunas)


if __name__ == "__main__":
    unittest.main()
