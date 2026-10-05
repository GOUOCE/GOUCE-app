// Gera um e-mail único por execução, para o cadastro de sucesso não esbarrar
// em "e-mail já cadastrado" quando a suíte roda mais de uma vez no mesmo banco.
output.email = 'qa.e2e.' + Date.now() + '@example.com'
