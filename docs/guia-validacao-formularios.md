# Guia de validação de formulários (front)

Regras para validar campos no app **antes** de enviar para a API. Vale para qualquer formulário:
cadastro, edição de perfil, renovação de vínculo, telas de administrador.

> **Por que este guia existe:** nos testes manuais de UI da HU-001, 10 casos falharam e a maioria
> tinha a mesma causa: o front deixava passar dados inválidos e só a API recusava, no envio final,
> com mensagem em inglês ou como `[object Object]`. Veja as [issues #49 a #70 no GitHub](https://github.com/GOUOCE/GOUCE-app/issues)
> e a suíte de testes de UI da HU-001 em `tests/manual/epico-01/HU-001/ui/`.

---

## 1. Regras de ouro

1. **Validar na etapa em que o dado é digitado.** O usuário não pode chegar ao fim do cadastro para descobrir um erro da etapa 1.
2. **Mesma regra no front e no back.** Os limites do front devem ser iguais aos do backend (tabela da seção 3). Se mudar um, mude o outro.
3. **Mensagens em português, claras e dizendo o que fazer.** Nunca exibir `Required`, `String should have at most...` ou `[object Object]`.
4. **Não validar enquanto a pessoa ainda está digitando.** Mostrar o erro ao sair do campo ou ao tocar em Próximo.
5. **Limpar antes de validar.** Remover espaços das pontas (`trim`) e, quando fizer sentido, máscara e caixa.
6. **Limitar a entrada quando o limite é conhecido.** Use `maxLength` no campo além da regra no schema.
7. **Nunca descartar dado do usuário em silêncio.** Se um arquivo ou valor não puder ser enviado, avise.

---

## 2. Como validar no projeto (zod + react-hook-form)

### 2.1. Mensagens padrão em português

O zod gera mensagens em inglês por padrão (`Required`, `Expected string`...). Configure uma vez,
no início do app, um mapa de erros em português:

```ts
import { z } from 'zod';

z.setErrorMap((issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type && issue.received === 'undefined') {
    return { message: 'Campo obrigatório' };
  }
  if (issue.code === z.ZodIssueCode.too_small) {
    return { message: `Informe pelo menos ${issue.minimum} caracteres` };
  }
  if (issue.code === z.ZodIssueCode.too_big) {
    return { message: `Use no máximo ${issue.maximum} caracteres` };
  }
  return { message: ctx.defaultError };
});
```

Mesmo assim, prefira escrever a mensagem em cada regra: `z.string().min(1, 'Informe o e-mail')`.

### 2.2. Quando mostrar o erro

```ts
useForm({
  resolver: zodResolver(schema),
  mode: 'onTouched',      // valida ao sair do campo, não a cada tecla
  reValidateMode: 'onChange', // depois do primeiro erro, some assim que a pessoa corrigir
});
```

### 2.3. Formulário em etapas: cuidado com `refine` no objeto inteiro

Um `.refine()` aplicado ao **objeto inteiro** (como "senha igual à confirmação") só roda quando
**todos** os campos do formulário são válidos. Num cadastro em etapas, os campos das etapas
seguintes ainda estão vazios, então essa regra **nunca roda na etapa 1**, e o erro só aparece no
envio final (issue #49).

Faça cada etapa ter o próprio schema e valide a etapa com ele:

```ts
const etapa1Schema = z
  .object({
    nomeCompleto: nomeSchema,
    email: emailSchema,
    dataNascimento: dataNascimentoSchema,
    senha: senhaSchema,
    confirmarSenha: z.string().min(1, 'Confirme a senha'),
  })
  .superRefine((dados, ctx) => {
    if (dados.senha !== dados.confirmarSenha) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmarSenha'],
        message: 'As senhas não coincidem',
      });
    }
  });

// Ao tocar em Próximo na etapa 1:
const resultado = etapa1Schema.safeParse(getValues());
if (!resultado.success) {
  resultado.error.issues.forEach((i) =>
    setError(i.path[0] as any, { message: i.message }),
  );
  return; // não avança
}
```

O schema completo do envio final pode ser a junção dos schemas das etapas
(`etapa1Schema.and(etapa2Schema)...`), assim a regra fica escrita uma vez só.

---

## 3. Regras por tipo de campo

Limites atuais do backend. Se o backend mudar, atualize esta tabela.

| Campo | Regra | Onde está no backend |
|---|---|---|
| Nome completo | 3 a 150 caracteres, nome e sobrenome | `CadastroUsuarioDTO.nome` e `criar_usuario_use_case.py` |
| E-mail | formato válido | `EmailStr` no DTO |
| Senha | 8 a 128 caracteres, maiúscula, minúscula e número | requisito HU-001 (AC-03); DTO limita a 128 |
| Data de nascimento | data real, não futura, idade de 16 a 120 anos | `data_nascimento_validator.py` |
| Telefone / WhatsApp | 11 dígitos, DDD válido, celular começando com 9 | `telefone_validator.py` |
| Semestre atual | 1 a 16 | `validar_etapa_3_use_case.py:75` |
| Comprovantes | PDF, PNG, JPG, JPEG ou WEBP, não vazio, até 10 MB | `salvar_arquivo_use_case.py` |

> A senha no backend aceita a partir de 6 caracteres, mas o requisito da HU-001 exige 8.
> O front segue o requisito (8). Alinhar o backend é tarefa à parte.

### 3.1. Nome completo

- Remover espaços das pontas antes de validar. Nome **só com espaços** é vazio (issue #52).
- De 3 a 150 caracteres, com `maxLength={150}` no campo (issue #52).
- Pelo menos duas partes. **Primeira e última parte com 2 letras ou mais.** Partes do meio são livres: podem ter 1 letra (`João P. Silva`) ou ser preposição (`de`, `da`, `dos`, `e`). Assim `A B` é recusado (issue #56).
- Aceitar letras com acento, cedilha, **hífen** (`Ana-Maria`) e **apóstrofo**, reto `'` e tipográfico `’`, que é o padrão do teclado do iPhone (issues #55 e #57).
- Recusar números e emoji.

```ts
const LETRAS = /^[A-Za-zÀ-ÖØ-öø-ÿ'’\-.]+$/;

export const nomeSchema = z
  .string()
  .transform((v) => v.trim().replace(/\s+/g, ' ').replace(/’/g, "'"))
  .pipe(
    z
      .string()
      .min(3, 'Informe seu nome completo')
      .max(150, 'O nome deve ter no máximo 150 caracteres')
      .refine((v) => v.split(' ').every((p) => LETRAS.test(p)), 'Use apenas letras, espaços, hífen ou apóstrofo')
      .refine((v) => {
        const partes = v.split(' ');
        if (partes.length < 2) return false;
        const primeira = partes[0].replace(/[^A-Za-zÀ-ÿ]/g, '');
        const ultima = partes[partes.length - 1].replace(/[^A-Za-zÀ-ÿ]/g, '');
        return primeira.length >= 2 && ultima.length >= 2;
      }, 'Informe nome e sobrenome completos'),
  );
```

### 3.2. E-mail

- Aplicar `trim` e passar para minúsculas antes de validar. E-mail colado com espaço não pode virar erro (issue #51).
- Usar `keyboardType="email-address"`, `autoCapitalize="none"` e `autoCorrect={false}`.
- A verificação de e-mail já cadastrado deve acontecer na etapa, não só no envio.

```ts
export const emailSchema = z
  .string()
  .transform((v) => v.trim().toLowerCase())
  .pipe(z.string().min(1, 'Informe o e-mail').email('E-mail inválido'));
```

### 3.3. Senha e confirmação

- De 8 a 128 caracteres, com `maxLength={128}` nos dois campos.
- Pelo menos uma letra maiúscula, uma minúscula e um número.
- A comparação com a confirmação fica **no schema da etapa** (seção 2.3), nunca só no envio.

```ts
export const senhaSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .max(128, 'A senha deve ter no máximo 128 caracteres')
  .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Inclua pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Inclua pelo menos um número');
```

### 3.4. Data de nascimento

- Máscara `DD/MM/AAAA`, aceitando só números e no máximo 8 dígitos.
- **A máscara não valida a data.** É preciso checar se o dia existe: `31/02/2002` e `99/99/9999` devem ser recusados (issue #54).
- Recusar data no futuro e idade fora de 16 a 120 anos.
- Mostrar "data inválida" só quando a data estiver completa ou ao sair do campo, nunca no primeiro dígito (issue #67).

```ts
export const dataNascimentoSchema = z
  .string()
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Use o formato DD/MM/AAAA')
  .refine((v) => {
    const [d, m, a] = v.split('/').map(Number);
    const data = new Date(a, m - 1, d);
    return data.getFullYear() === a && data.getMonth() === m - 1 && data.getDate() === d;
  }, 'Data inválida')
  .refine((v) => {
    const [d, m, a] = v.split('/').map(Number);
    const hoje = new Date();
    let idade = hoje.getFullYear() - a;
    if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) idade--;
    return idade >= 16 && idade <= 120;
  }, 'É preciso ter entre 16 e 120 anos');
```

### 3.5. Telefone / WhatsApp

- **Máscara `(XX) 9XXXX-XXXX`**, aceitando só números (`keyboardType="number-pad"`), no máximo 11 dígitos (issue #69).
- Validar os 11 dígitos sem a máscara: DDD válido, terceiro dígito igual a 9 e não todos iguais.
- Enviar para a API só os números ou o formato com máscara, que o backend aceita nos dois casos.

```ts
const DDDS = [11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,98,99];

export const telefoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .pipe(
    z
      .string()
      .length(11, 'Informe DDD e número com 9 dígitos')
      .refine((v) => DDDS.includes(Number(v.slice(0, 2))), 'DDD inválido')
      .refine((v) => v[2] === '9', 'Informe um número de celular (começa com 9)')
      .refine((v) => new Set(v).size > 1, 'Número inválido'),
  );
```

### 3.6. Seletores (curso, campus, período, turno, semestre...)

- A área inteira do seletor abre a lista, **inclusive a seta** (issue #68).
- As opções vêm de uma fonte de dados (API ou constante compartilhada), não de listas soltas na tela. Elas precisam coincidir com o que a API aceita (lembre o defeito do turno, #30).
- Listas longas usam busca com autocomplete (issue #63).
- Opção **Outro** abre um campo de texto para a pessoa informar o valor (issue #63).
- Nunca trocar a escolha da pessoa por um valor inventado. Exemplo: “Anterior” não pode virar `2022.1` (issue #58).
- Períodos e datas que mudam com o tempo são gerados a partir da data atual, não fixos no código (issue #62).

### 3.7. Arquivos (comprovantes, foto)

- Validar **ao selecionar**: formato (PDF, PNG, JPG, JPEG, WEBP), arquivo não vazio e até 10 MB (issue #64).
- A mensagem diz o que é permitido: “Envie PDF ou imagem (PNG, JPG ou WEBP) de até 10 MB”.
- Mostrar o nome do arquivo escolhido no lugar certo e permitir trocar.
- Se o arquivo não puder ser enviado, avisar. Nunca removê-lo do envio em silêncio.

### 3.8. Aceite de termos

- A caixa de marcar precisa ser visível, com estado marcado e desmarcado claros (issue #60).
- Começa desmarcada. O botão de concluir só habilita com o aceite marcado.
- O texto dos termos é o definitivo, em português (issue #59).

---

## 4. Exibição de erros e layout

- **Erro abaixo do campo**, com quebra de linha. Mensagem longa nunca passa para fora do campo nem cobre os vizinhos (issue #66):

  ```tsx
  <Text style={{ color: theme.colors.error, flexShrink: 1, flexWrap: 'wrap' }}>
    {errors.senha?.message}
  </Text>
  ```

- **Teclado não cobre campos nem botões.** Envolva o formulário em `KeyboardAvoidingView` + `ScrollView` com `keyboardShouldPersistTaps="handled"` (issue #50).
- **Erros da API sempre como texto.** A API responde em dois formatos: `{ error: { details: [{ field, message }] } }` e `{ detail: { erros: [...] } }`. Use o `getErrorMessage` de `frontend/src/utils/errorUtils.ts` e nunca passe o objeto direto para `alert` ou para o popup (issue #31).
- **Ao voltar de um erro da API, leve a pessoa ao campo com problema**, com a mensagem visível.

---

## 5. Checklist para PR com formulário

Antes de abrir o PR, confira em cada campo novo ou alterado:

- [ ] A regra do front é igual à do backend (tabela da seção 3)
- [ ] Vazio e só com espaços são recusados na própria etapa
- [ ] Mínimo e máximo validados, com `maxLength` no campo
- [ ] Máscara aplicada (data, telefone) e o valor validado de verdade, não só formatado
- [ ] Mensagens em português, dizendo o que corrigir
- [ ] Erro aparece ao sair do campo ou ao avançar, não enquanto digita
- [ ] Regras entre campos (senha × confirmação) estão no schema da etapa
- [ ] Mensagem longa quebra linha sem sair do campo
- [ ] Teclado aberto não esconde campo, erro ou botão
- [ ] Erro da API aparece como texto legível
- [ ] Testado colando valores (com espaços, acima do limite, com emoji)
