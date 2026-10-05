# Como executar os testes E2E da HU-001

Passo a passo para rodar a suíte automatizada da HU-001 com o Maestro. O planejamento dos casos
está em [`E2E-HU-001.md`](E2E-HU-001.md); as convenções gerais (seletores, tags, subflows) estão no
[README dos testes E2E](../../../README.md).

```
tests/e2e/flows/epico-01/HU-001/
├── README.md        ← este arquivo
├── E2E-HU-001.md    ← planejamento e resultado da suíte
└── CT-HU001-UI-*.yaml ← um fluxo por caso (o ID do plano está no `name` de cada fluxo)
```

---

## 1. Pré-requisitos (uma vez só)

- Java 17+, Android SDK com o emulador `Pixel_7` e Maestro instalados.
- Dependências do projeto: `npm ci --legacy-peer-deps`.

## 2. Subir o backend com banco vazio

```bash
docker compose down -v
docker compose up -d --build postgres minio backend
curl localhost:8000/health   # deve responder {"status":"ok"}
```

> `down -v` apaga o banco local. Para não perder seus dados, use um projeto separado com outras
> portas (ex.: backend em `8001`) e gere o APK com `EXPO_PUBLIC_API_URL=http://10.0.2.2:8001`.

## 3. Gerar e instalar o APK

```bash
npx expo prebuild --platform android      # só na primeira vez
git checkout -- package.json               # o prebuild altera os scripts; desfaça
cd android
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000 ./gradlew assembleRelease -PreactNativeArchitectures=x86_64
cd ..
emulator -avd Pixel_7 &
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

O primeiro build leva de 10 a 20 minutos; os seguintes, cerca de 2.

> **HTTP no APK de release:** o app precisa de `usesCleartextTraffic` para falar com o backend local
> em `http://`. Enquanto a correção com `expo-build-properties` não entrar na `develop`, confira se o
> `android/app/src/main/AndroidManifest.xml` tem `android:usesCleartextTraffic="true"` na tag
> `<application>`; sem isso, o app mostra "Erro de conexão com o servidor".

## 4. Copiar o comprovante para o emulador

```bash
adb push tests/e2e/dados/comprovante.pdf /sdcard/Download/comprovante.pdf
```

Se der `Operation not permitted` logo após ligar o emulador, espere alguns segundos (o armazenamento
ainda está sendo montado) e repita.

## 5. Executar

```bash
# suíte essencial da HU-001 (sem os bugs conhecidos)
maestro test tests/e2e/flows/epico-01/HU-001 --include-tags essencial --exclude-tags bug-conhecido

# casos extras
maestro test tests/e2e/flows/epico-01/HU-001 --include-tags regressao

# só os bugs conhecidos
maestro test tests/e2e/flows/epico-01/HU-001 --include-tags bug-conhecido

# um caso específico
maestro test tests/e2e/flows/epico-01/HU-001/CT-HU001-UI-002-cadastro-completo.yaml
```

## 6. Registrar o resultado

Atualize a tabela **Resultado da execução** em [`E2E-HU-001.md`](E2E-HU-001.md) com o status de cada
caso e a data em **Última execução**. Se um caso falhar por defeito do app, abra a issue com o modelo
[`ISSUE-BUG-API.md`](../../../../manual/modelos/ISSUE-BUG-API.md) e cite o ID do caso (`E2E-HU001-0X`).
