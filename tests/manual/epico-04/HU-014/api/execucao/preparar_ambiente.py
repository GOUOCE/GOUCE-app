"""Gera configuração temporária; nunca imprime credenciais ou usa .env do usuário."""
import argparse
import os
import secrets
from datetime import date
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--runtime-dir', default='/tmp/hu014-runtime')
parser.add_argument('--evidence-dir')
args = parser.parse_args()
source = Path(__file__).resolve().parents[6]
runtime = Path(args.runtime_dir)
runtime.mkdir(parents=True, exist_ok=True)
env_file = runtime / 'runtime.env'
if env_file.exists():
    raise SystemExit('Configuração já existe; use outro diretório para uma nova rodada.')
evidence = Path(args.evidence_dir).resolve() if args.evidence_dir else (
    source / 'tests/manual/epico-04/HU-014/api/evidencias' / date.today().isoformat())
evidence.mkdir(parents=True, exist_ok=True)
values = {
    'HU014_DB_PASSWORD': secrets.token_hex(20),
    'HU014_STORAGE_PASSWORD': secrets.token_hex(20),
    'HU014_JWT_SECRET': secrets.token_hex(32),
    'HU014_ACCOUNT_PASSWORD': 'Qa@' + secrets.token_hex(18),
    'HU014_SOURCE_ROOT': str(source),
    'HU014_EVIDENCE_DIR': str(evidence),
    'HU014_UID': str(os.getuid()),
    'HU014_GID': str(os.getgid()),
}
with env_file.open('x') as stream:
    os.chmod(env_file, 0o600)
    stream.write(''.join(f'{key}={value}\n' for key, value in values.items()))
print(f'Configuração temporária criada em {env_file}; segredos não exibidos.')
