import os
import unittest
from types import SimpleNamespace

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/gouce_test",
)

from src.modulos.usuarios.infrastructure.repositories.usuario_repository import (
    SQLAlchemyUsuarioRepository,
)
from src.shared.security.lgpd_encryption import hash_email


class FakeQuery:
    def __init__(self, session, detailed):
        self.session = session
        self.detailed = detailed

    def filter(self, *args):
        return self

    def outerjoin(self, *args):
        return self

    def first(self):
        if self.detailed:
            return self.session.usuario, self.session.aluno
        return self.session.usuario


class FakeSession:
    def __init__(self, *, fail_commit=False):
        self.usuario = SimpleNamespace(
            id=1,
            email="atual@example.com",
            email_hash=hash_email("atual@example.com"),
            telefone="85999990000",
        )
        self.aluno = SimpleNamespace(aluno_id=1, bairro_id="Centro")
        self.fail_commit = fail_commit
        self.commit_count = 0
        self.rollback_count = 0
        self._original = {
            "email": self.usuario.email,
            "email_hash": self.usuario.email_hash,
            "telefone": self.usuario.telefone,
            "bairro_id": self.aluno.bairro_id,
        }

    def query(self, *models):
        return FakeQuery(self, detailed=len(models) > 1)

    def commit(self):
        self.commit_count += 1
        if self.fail_commit:
            raise RuntimeError("falha de persistência")

    def refresh(self, instance):
        return None

    def rollback(self):
        self.rollback_count += 1
        self.usuario.email = self._original["email"]
        self.usuario.email_hash = self._original["email_hash"]
        self.usuario.telefone = self._original["telefone"]
        self.aluno.bairro_id = self._original["bairro_id"]


class UsuarioRepositoryUpdatesTest(unittest.TestCase):
    def test_atualizar_email_atualiza_email_e_hash_juntos(self):
        session = FakeSession()
        repository = SQLAlchemyUsuarioRepository(session)

        usuario = repository.atualizar_email(1, "  NOVO@example.com ")

        self.assertIs(usuario, session.usuario)
        self.assertEqual(session.usuario.email, "novo@example.com")
        self.assertEqual(session.usuario.email_hash, hash_email("novo@example.com"))
        self.assertEqual(session.commit_count, 1)
        self.assertEqual(session.rollback_count, 0)

    def test_atualizar_email_faz_rollback_e_propaga_falha(self):
        session = FakeSession(fail_commit=True)
        repository = SQLAlchemyUsuarioRepository(session)

        with self.assertRaisesRegex(RuntimeError, "falha de persistência"):
            repository.atualizar_email(1, "novo@example.com")

        self.assertEqual(session.rollback_count, 1)
        self.assertEqual(session.usuario.email, "atual@example.com")
        self.assertEqual(
            session.usuario.email_hash,
            hash_email("atual@example.com"),
        )

    def test_atualizar_dados_parciais_faz_rollback_sem_deixar_atualizacao_parcial(self):
        session = FakeSession(fail_commit=True)
        repository = SQLAlchemyUsuarioRepository(session)

        with self.assertRaisesRegex(RuntimeError, "falha de persistência"):
            repository.atualizar_dados_parciais(
                1,
                telefone="85988881111",
                bairro_id="Aldeota",
            )

        self.assertEqual(session.rollback_count, 1)
        self.assertEqual(session.usuario.telefone, "85999990000")
        self.assertEqual(session.aluno.bairro_id, "Centro")


if __name__ == "__main__":
    unittest.main()
