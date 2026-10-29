import unittest

from src.modulos.usuarios.infrastructure.repositories.usuario_repository import SQLAlchemyUsuarioRepository


class ListarUsuariosFiltrosTest(unittest.TestCase):
    def test_validar_ordem_data_aceita_apenas_asc_e_desc(self):
        self.assertEqual(SQLAlchemyUsuarioRepository.validar_ordem_data("asc"), "asc")
        self.assertEqual(SQLAlchemyUsuarioRepository.validar_ordem_data("DESC"), "desc")
        self.assertIsNone(SQLAlchemyUsuarioRepository.validar_ordem_data(None))

        with self.assertRaises(ValueError):
            SQLAlchemyUsuarioRepository.validar_ordem_data("crescente")


if __name__ == "__main__":
    unittest.main()
