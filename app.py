from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
import random
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash  # <--- IMPORTANTE

app = Flask(__name__)
CORS(app)

ARQUIVO_DADOS = os.path.join('backend', 'dados.json')
ARQUIVO_PRODUTOS = os.path.join('backend', 'produtos.json')

def ler_dados():
    if not os.path.exists(ARQUIVO_DADOS):
        dados_iniciais = {"usuarios": [], "pedidos": []}
        with open(ARQUIVO_DADOS, 'w', encoding='utf-8') as f:
            json.dump(dados_iniciais, f, ensure_ascii=False, indent=4)
        return dados_iniciais
    
    with open(ARQUIVO_DADOS, 'r', encoding='utf-8') as f:
        return json.load(f)

def salvar_dados(dados):
    with open(ARQUIVO_DADOS, 'w', encoding='utf-8') as f:
        json.dump(dados, f, ensure_ascii=False, indent=4)

# --- ROTAS PARA SERVIR AS PÁGINAS HTML E SCRIPTS ---

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/index.html')
def pagina_index():
    return send_from_directory('.', 'index.html')

@app.route('/carrinho.html')
def pagina_carrinho():
    return send_from_directory('.', 'carrinho.html')

@app.route('/script.js')
def serve_script():
    return send_from_directory('.', 'script.js')

@app.route('/frontend/<path:filename>')
def serve_static(filename):
    return send_from_directory('frontend', filename)


# --- ROTAS DA API COM WERKZEUG.SECURITY ---

@app.route('/api/cadastrar', methods=['POST'])
def cadastrar():
    data = request.get_json()
    nome = data.get('nome')
    email = data.get('email')
    senha_puro = data.get('senha')

    dados = ler_dados()
    if any(u['email'] == email for u in dados['usuarios']):
        return jsonify({"sucesso": False, "mensagem": "E-mail já cadastrado!"}), 400

    # Gera o hash seguro com Werkzeug (já inclui salt automático)
    senha_segura = generate_password_hash(senha_puro)

    novo_usuario = {"nome": nome, "email": email, "senha": senha_segura}
    dados['usuarios'].append(novo_usuario)
    salvar_dados(dados)

    return jsonify({"sucesso": True, "mensagem": "Usuário cadastrado com sucesso!"})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    senha_puro = data.get('senha')

    dados = ler_dados()
    # Procura o utilizador pelo e-mail
    usuario = next((u for u in dados['usuarios'] if u['email'] == email), None)

    # O Werkzeug compara a senha digitada em texto puro com o hash guardado no JSON
    if usuario and check_password_hash(usuario['senha'], senha_puro):
        return jsonify({
            "sucesso": True,
            "usuario": {"nome": usuario['nome'], "email": usuario['email']}
        })
    else:
        return jsonify({"sucesso": False, "mensagem": "E-mail ou senha incorretos."}), 401

@app.route('/api/trocar-senha', methods=['POST'])
def trocar_senha():
    data = request.get_json()
    email = data.get('email')
    nova_senha_puro = data.get('novaSenha')

    dados = ler_dados()
    usuario = next((u for u in dados['usuarios'] if u['email'] == email), None)

    if usuario:
        # Atualiza gerando um novo hash seguro
        usuario['senha'] = generate_password_hash(nova_senha_puro)
        salvar_dados(dados)
        return jsonify({"sucesso": True, "mensagem": "Senha alterada com sucesso!"})
    
    return jsonify({"sucesso": False, "mensagem": "Usuário não encontrado."}), 404

@app.route('/api/pedidos', methods=['POST'])
def criar_pedido():
    data = request.get_json()
    email = data.get('clienteEmail')
    nome = data.get('clienteNome')
    itens = data.get('itens')
    total = data.get('total')

    if not itens or len(itens) == 0:
        return jsonify({"sucesso": False, "mensagem": "Carrinho vazio!"}), 400

    dados = ler_dados()
    numero_pedido = random.randint(10000, 99999)
    data_atual = datetime.now().strftime('%d/%m/%Y às %H:%M')

    novo_pedido = {
        "id": numero_pedido,
        "data": data_atual,
        "clienteEmail": email,
        "clienteNome": nome,
        "itens": itens,
        "total": total
    }

    dados['pedidos'].append(novo_pedido)
    salvar_dados(dados)

    return jsonify({
        "sucesso": True, 
        "mensagem": "Pedido realizado com sucesso!",
        "pedido": novo_pedido
    })

@app.route('/api/pedidos/<email>', methods=['GET'])
def listar_pedidos(email):
    dados = ler_dados()
    pedidos_usuario = [p for p in dados['pedidos'] if p['clienteEmail'] == email]
    return jsonify({"sucesso": True, "pedidos": pedidos_usuario})

@app.route('/api/produtos', methods=['GET'])
def listar_produtos():
    # caminho_produtos = os.path.join('backend', 'produtos.json')
    if not os.path.exists(ARQUIVO_PRODUTOS):
        return jsonify({"sucesso": False, "mensagem": "Arquivo de produtos não encontrado."}), 404
    
    with open(ARQUIVO_PRODUTOS, 'r', encoding='utf-8') as f:
        produtos = json.load(f)
    
    return jsonify({"sucesso": True, "produtos": produtos})

if __name__ == '__main__':
    app.run(debug=True, port=5000)