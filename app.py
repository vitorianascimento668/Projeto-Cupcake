from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import os
import random
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import json

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'backend', 'cupcake.db')

def conectar_db():
    """Retorna uma conexão com o banco SQLite configurada para retornar dicionários nas consultas."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def inicializar_banco():
    """Cria as tabelas e insere os produtos iniciais caso o banco não exista."""
    os.makedirs('backend', exist_ok=True)
    conn = conectar_db()
    cursor = conn.cursor()

    # Tabela de Usuários
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL
        )
    ''')

    # Tabela de Produtos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            preco REAL NOT NULL,
            imagem TEXT NOT NULL
        )
    ''')

    # Tabela de Pedidos (os itens do carrinho serão salvos como texto JSON)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pedidos (
            id INTEGER PRIMARY KEY,
            data TEXT NOT NULL,
            cliente_email TEXT NOT NULL,
            cliente_nome TEXT NOT NULL,
            total REAL NOT NULL,
            itens TEXT NOT NULL
        )
    ''')

    # Popula os produtos iniciais se a tabela estiver vazia (substitui o produtos.json)
    cursor.execute('SELECT COUNT(*) FROM produtos')
    if cursor.fetchone()[0] == 0:
        produtos_iniciais = [
            ("Morango", 15.00, "frontend/cupcake-morango.jpg"),
            ("Maracujá", 15.00, "frontend/cupcake-maracuja.jpg"),
            ("Chocolate", 15.00, "frontend/cupcake-chocolate.jpg"),
            ("Leite Ninho", 15.00, "frontend/cupcake-leite-ninho.jpeg"),
            ("Doce de Leite", 15.00, "frontend/cupcake-doce-de-leite.jpeg"),
            ("Amora", 15.00, "frontend/cupcake-amora.jpeg")
        ]
        cursor.executemany('INSERT INTO produtos (nome, preco, imagem) VALUES (?, ?, ?)', produtos_iniciais)

    conn.commit()
    conn.close()

# Inicializa o banco assim que o app sobe
inicializar_banco()


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


# --- ROTAS DA API COM SQLITE ---

@app.route('/api/cadastrar', methods=['POST'])
def cadastrar():
    data = request.get_json()
    nome = data.get('nome')
    email = data.get('email')
    senha_puro = data.get('senha')

    senha_segura = generate_password_hash(senha_puro)

    conn = conectar_db()
    cursor = conn.cursor()

    try:
        cursor.execute('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)', (nome, email, senha_segura))
        conn.commit()
        return jsonify({"sucesso": True, "mensagem": "Usuário cadastrado com sucesso!"})
    except sqlite3.IntegrityError:
        return jsonify({"sucesso": False, "mensagem": "E-mail já cadastrado!"}), 400
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    senha_puro = data.get('senha')

    conn = conectar_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM usuarios WHERE email = ?', (email,))
    usuario = cursor.fetchone()
    conn.close()

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

    nova_senha_segura = generate_password_hash(nova_senha_puro)

    conn = conectar_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE usuarios SET senha = ? WHERE email = ?', (nova_senha_segura, email))
    conn.commit()
    alteracoes = cursor.rowcount
    conn.close()

    if alteracoes > 0:
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

    numero_pedido = random.randint(10000, 99999)
    data_atual = datetime.now().strftime('%d/%m/%Y às %H:%M')
    itens_json = json.dumps(itens) # Converte a lista de itens para texto JSON

    conn = conectar_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO pedidos (id, data, cliente_email, cliente_nome, total, itens)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (numero_pedido, data_atual, email, nome, total, itens_json))
    conn.commit()
    conn.close()

    novo_pedido = {
        "id": numero_pedido,
        "data": data_atual,
        "clienteEmail": email,
        "clienteNome": nome,
        "itens": itens,
        "total": total
    }

    return jsonify({
        "sucesso": True, 
        "mensagem": "Pedido realizado com sucesso!",
        "pedido": novo_pedido
    })

@app.route('/api/pedidos/<email>', methods=['GET'])
def listar_pedidos(email):
    conn = conectar_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM pedidos WHERE cliente_email = ?', (email,))
    registros = cursor.fetchall()
    conn.close()

    pedidos_usuario = []
    for reg in registros:
        pedidos_usuario.append({
            "id": reg['id'],
            "data": reg['data'],
            "clienteEmail": reg['cliente_email'],
            "clienteNome": reg['cliente_nome'],
            "total": reg['total'],
            "itens": json.loads(reg['itens']) # Converte o texto JSON de volta para lista
        })

    return jsonify({"sucesso": True, "pedidos": pedidos_usuario})

@app.route('/api/produtos', methods=['GET'])
def listar_produtos():
    conn = conectar_db()
    cursor = conn.cursor()
    cursor.execute('SELECT nome, preco, imagem FROM produtos')
    produtos = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({"sucesso": True, "produtos": produtos})

@app.route('/admin/cupcake-dados')
def ver_dados_admin():
    conn = conectar_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM usuarios')
    usuarios = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute('SELECT * FROM pedidos')
    pedidos = [dict(row) for row in cursor.fetchall()]

    cursor.execute('SELECT * FROM produtos')
    produtos = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    # Gera uma página HTML estilizada com tabelas
    html = """
    <!DOCTYPE html>
    <html lang="pt">
    <head>
        <meta charset="UTF-8">
        <title>Painel Administrativo - SQLite</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 30px; background: #f4f4f4; color: #333; }
            h1 { color: #5d31b0; }
            h2 { color: #a44eaa; border-bottom: 2px solid #a44eaa; padding-bottom: 5px; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; background: white; margin-top: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            th, td { padding: 10px 12px; border: 1px solid #ddd; text-align: left; font-size: 14px; }
            th { background-color: #a44eaa; color: white; }
            tr:nth-child(even) { background-color: #fafafa; }
        </style>
    </head>
    <body>
        <h1>🗄️ Painel Administrativo do Banco de Dados</h1>
        
        <h2>Usuários</h2>
        <table>
            <tr><th>ID</th><th>Nome</th><th>E-mail</th><th>Senha (Hash)</th></tr>
            """
    for u in usuarios:
        html += f"<tr><td>{u['id']}</td><td>{u['nome']}</td><td>{u['email']}</td><td><small>{u['senha']}</small></td></tr>"
    
    html += """
        </table>

        <h2>Pedidos</h2>
        <table>
            <tr><th>ID Pedido</th><th>Data</th><th>E-mail Cliente</th><th>Nome Cliente</th><th>Total</th><th>Itens</th></tr>
            """
    for p in pedidos:
        html += f"<tr><td>#{p['id']}</td><td>{p['data']}</td><td>{p['cliente_email']}</td><td>{p['cliente_nome']}</td><td>R$ {p['total']:.2f}</td><td><small>{p['itens']}</small></td></tr>"

    html += """
        </table>

        <h2>Produtos</h2>
        <table>
            <tr><th>ID</th><th>Nome</th><th>Preço</th><th>Imagem</th></tr>
            """
    for prod in produtos:
        html += f"<tr><td>{prod['id']}</td><td>{prod['nome']}</td><td>R$ {prod['preco']:.2f}</td><td>{prod['imagem']}</td></tr>"

    html += """
        </table>
    </body>
    </html>
    """
    return html

if __name__ == '__main__':
    app.run(debug=True, port=5000)