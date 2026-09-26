import re, pathlib

file_path = pathlib.Path('backend/src/modulos/usuarios/application/use_cases/validar_etapa_2_use_case.py')
content = file_path.read_text(encoding='utf-8')

# Adjust handling of enum fields to extract value if enum
# Replace raca_str = str(dto.raca).strip()... with raca_val = dto.raca.value if dto.raca else ''
content = re.sub(r'raca_str = str\(dto\.raca\)\.strip\(\) if dto\.raca else ""',
                 'raca_val = dto.raca.value if dto.raca else ""', content)
content = re.sub(r'if not raca_str:', 'if not raca_val:', content)
content = re.sub(r'is_valid, _ = self\.demograficos_validator\.validar_e_formatar_raca\(raca_str\)',
                 'is_valid, _ = self.demograficos_validator.validar_e_formatar_raca(raca_val)', content)

# Same for identificacao_sexual
content = re.sub(r'sexual_str = str\(dto\.identificacao_sexual\)\.strip\(\) if dto\.identificacao_sexual else ""',
                 'sexual_val = dto.identificacao_sexual.value if dto.identificacao_sexual else ""', content)
content = re.sub(r'if not sexual_str:', 'if not sexual_val:', content)
content = re.sub(r'is_valid, _ = self\.demograficos_validator\.validar_e_formatar_identidade_sexual\(sexual_str\)',
                 'is_valid, _ = self.demograficos_validator.validar_e_formatar_identidade_sexual(sexual_val)', content)

# genero
content = re.sub(r'genero_str = str\(dto\.identificacao_genero\)\.strip\(\) if dto\.identificacao_genero else ""',
                 'genero_val = dto.identificacao_genero.value if dto.identificacao_genero else ""', content)
content = re.sub(r'if not genero_str:', 'if not genero_val:', content)
content = re.sub(r'is_valid, _ = self\.demograficos_validator\.validar_e_formatar_genero\(genero_str\)',
                 'is_valid, _ = self.demograficos_validator.validar_e_formatar_genero(genero_val)', content)

# transgenero
content = re.sub(r'trans_str = str\(dto\.transgenero\)\.strip\(\) if dto\.transgenero is not None else ""',
                 'trans_val = dto.transgenero.value if dto.transgenero else ""', content)
content = re.sub(r'if not trans_str:', 'if not trans_val:', content)
content = re.sub(r'is_valid, _ = self\.demograficos_validator\.validar_e_formatar_sim_nao_prefiro\(trans_str\)',
                 'is_valid, _ = self.demograficos_validator.validar_e_formatar_sim_nao_prefiro(trans_val)', content)

# tem_filhos
content = re.sub(r'filhos_str = str\(dto\.tem_filhos\)\.strip\(\) if dto\.tem_filhos is not None else ""',
                 'filhos_val = dto.tem_filhos.value if dto.tem_filhos else ""', content)
content = re.sub(r'if not filhos_str:', 'if not filhos_val:', content)
content = re.sub(r'is_valid, _ = self\.demograficos_validator\.validar_e_formatar_sim_nao_prefiro\(filhos_str\)',
                 'is_valid, _ = self.demograficos_validator.validar_e_formatar_sim_nao_prefiro(filhos_val)', content)

file_path.write_text(content, encoding='utf-8')
