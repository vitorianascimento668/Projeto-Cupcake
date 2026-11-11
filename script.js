// Carrega o carrinho salvo no navegador (ou inicia uma lista vazia)
let carrinho = JSON.parse(localStorage.getItem("meuCarrinho")) || [];

// Executa assim que a página é totalmente carregada
document.addEventListener("DOMContentLoaded", () => {
    atualizarContadorGlobal();

    // Se estivermos na página do carrinho, renderiza os itens na tela
    if (document.getElementById("lista-carrinho")) {
        renderizarCarrinhoPagina();
    }
});

function adicionar_carrinho(nomeProduto, preco) {
    let itemExistente = carrinho.find(item => item.nome === nomeProduto);

    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({
            nome: nomeProduto,
            preco: preco,
            quantidade: 1
        });
    }

    salvarEAtualizar(nomeProduto);
}

function salvarEAtualizar(nomeProduto) {
    localStorage.setItem("meuCarrinho", JSON.stringify(carrinho));
    atualizarContadorGlobal();
    exibirMensagemFeedback(nomeProduto);
}

function atualizarContadorGlobal() {
    let totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
    let contador = document.getElementById("cart-count");
    if (contador) {
        contador.innerText = totalItens;
    }
}

function exibirMensagemFeedback(nomeProduto) {
    let aviso = document.getElementById("mensagem-status");
    if (aviso) {
        aviso.innerText = nomeProduto + " foi adicionado ao carrinho!";
        setTimeout(() => {
            aviso.innerText = "";
        }, 5000);
    }
}

// Renderiza os itens na página carrinho.html com os botões de quantidade
function renderizarCarrinhoPagina() {
    let listaHTML = document.getElementById("lista-carrinho");
    let totalHTML = document.getElementById("valor-total");

    listaHTML.innerHTML = "";

    if (carrinho.length === 0) {
        listaHTML.innerHTML = "<p style='color: #666; text-align: center; padding: 20px;'>Seu carrinho está vazio.</p>";
        totalHTML.innerText = "R$ 0,00";
        return;
    }

    let valorTotal = 0;

    carrinho.forEach((item, index) => {
        let subtotal = item.preco * item.quantidade;
        valorTotal += subtotal;

        let divItem = document.createElement("div");
        divItem.style.display = "flex";
        divItem.style.justifyContent = "space-between";
        divItem.style.alignItems = "center";
        divItem.style.padding = "12px";
        divItem.style.border = "1px solid #eee";
        divItem.style.borderRadius = "4px";

        divItem.innerHTML = `
            <div>
                <strong>${item.nome}</strong><br>
                <small style="color: #666;">Unitário: R$ ${item.preco.toFixed(2).replace('.', ',')}</small>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <!-- Controles de Quantidade -->
                <div style="display: flex; align-items: center; border: 1px solid #ccc; border-radius: 4px; overflow: hidden; background: #fafafa;">
                    <button onclick="diminuirQuantidade(${index})" style="background: #e0e0e0; border: none; padding: 5px 10px; cursor: pointer; font-weight: bold;">-</button>
                    <span style="padding: 0 12px; font-weight: bold; font-size: 14px;">${item.quantidade}</span>
                    <button onclick="aumentarQuantidade(${index})" style="background: #e0e0e0; border: none; padding: 5px 10px; cursor: pointer; font-weight: bold;">+</button>
                </div>
                
                <span style="font-weight: bold; color: #a44eaa; min-width: 80px; text-align: right;">R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
                
                <button onclick="removerItem(${index})" style="background-color: #d9534f; color: white; border: none; padding: 6px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;">Remover</button>
            </div>
        `;
        listaHTML.appendChild(divItem);
    });

    totalHTML.innerText = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
}

// Aumenta a quantidade do item
function aumentarQuantidade(index) {
    carrinho[index].quantidade++;
    sincronizarCarrinho();
}

// Diminui a quantidade ou remove se chegar a zero
function diminuirQuantidade(index) {
    if (carrinho[index].quantidade > 1) {
        carrinho[index].quantidade--;
    } else {
        carrinho.splice(index, 1); // Remove o item se a quantidade for 1 e clicar em '-'
    }
    sincronizarCarrinho();
}

// Remove um item específico inteiramente
function removerItem(index) {
    carrinho.splice(index, 1);
    sincronizarCarrinho();
}

// Função auxiliar para salvar no navegador e redesenhar a tela
function sincronizarCarrinho() {
    localStorage.setItem("meuCarrinho", JSON.stringify(carrinho));
    atualizarContadorGlobal();
    renderizarCarrinhoPagina();
}

// Finaliza a compra esvaziando o carrinho
function finalizarCompra() {
    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }
    alert("Compra finalizada com sucesso! Obrigado por comprar na Cupcake.");
    carrinho = [];
    localStorage.removeItem("meuCarrinho");
    atualizarContadorGlobal();
    renderizarCarrinhoPagina();
}

// --- FUNÇÕES DE AUTENTICAÇÃO REAL COM LOCALSTORAGE ---

// Carrega os usuários salvos no navegador (ou inicia uma lista vazia)
let usuariosCadastrados = JSON.parse(localStorage.getItem("meusUsuarios")) || [];

function abrirAuth() {
    event.preventDefault();
    document.getElementById("modal-auth").style.display = "flex";
}

function fecharAuth() {
    document.getElementById("modal-auth").style.display = "none";
}

function alternarAba(aba) {
    let formLogin = document.getElementById("form-login");
    let formRegistro = document.getElementById("form-registro");
    let tabLogin = document.getElementById("tab-login");
    let tabRegistro = document.getElementById("tab-registro");

    if (aba === 'login') {
        formLogin.style.display = "flex";
        formRegistro.style.display = "none";
        tabLogin.style.color = "#a44eaa";
        tabLogin.style.borderBottom = "2px solid #a44eaa";
        tabRegistro.style.color = "#666";
        tabRegistro.style.borderBottom = "none";
    } else {
        formLogin.style.display = "none";
        formRegistro.style.display = "flex";
        tabRegistro.style.color = "#a44eaa";
        tabRegistro.style.borderBottom = "2px solid #a44eaa";
        tabLogin.style.color = "#666";
        tabLogin.style.borderBottom = "none";
    }
}

// Trata o cadastro de novos usuários
function cadastrarUsuario(event) {
    event.preventDefault();

    let nome = document.getElementById("reg-nome").value;
    let email = document.getElementById("reg-email").value;
    let senha = document.getElementById("reg-senha").value;

    // 1. Verifica se o e-mail já está cadastrado
    let usuarioExistente = usuariosCadastrados.find(u => u.email === email);
    if (usuarioExistente) {
        alert("Este e-mail já está cadastrado! Tente fazer login.");
        return;
    }

    // 2. Cria o novo usuário e adiciona à lista
    let novoUsuario = { nome: nome, email: email, senha: senha };
    usuariosCadastrados.push(novoUsuario);

    // 3. Salva no localStorage
    localStorage.setItem("meusUsuarios", JSON.stringify(usuariosCadastrados));

    alert("Conta criada com sucesso! Agora você pode fazer login.");
    
    // Reseta o formulário e vai para a aba de login
    document.getElementById("form-registro").reset();
    alternarAba('login');
}

// Trata a validação do login
function fazerLogin(event) {
    event.preventDefault();

    let email = document.getElementById("login-email").value;
    let senha = document.getElementById("login-senha").value;

    // Procura por um usuário com o mesmo e-mail e senha
    let usuarioValido = usuariosCadastrados.find(u => u.email === email && u.senha === senha);

    if (usuarioValido) {
        alert(`Bem-vindo(a), ${usuarioValido.nome}! Login realizado com sucesso.`);
        
        // Salva quem é o usuário logado atualmente no sistema
        localStorage.setItem("usuarioLogado", JSON.stringify(usuarioValido));
        
        document.getElementById("form-login").reset();
        fecharAuth();
        atualizarHeaderUsuario();
    } else {
        alert("E-mail ou senha incorretos. Tente novamente.");
    }
}

// Atualiza o menu superior para mostrar o nome da pessoa logada
// ATUALIZAÇÃO DA FUNÇÃO ANTIGA DE HEADER
function atualizarHeaderUsuario() {
    let usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    let linkUsuario = document.getElementById("link-usuario");

    if (linkUsuario && usuarioLogado) {
        linkUsuario.innerHTML = `👤 Olá, ${usuarioLogado.nome.split(' ')[0]}`;
        linkUsuario.setAttribute("onclick", "abrirMenuUsuario()");
    }
}

// Executa o teste do usuário logado assim que a página carrega
document.addEventListener("DOMContentLoaded", () => {
    atualizarHeaderUsuario();
});


// --- FUNÇÕES DO MENU DE USUÁRIO LOGADO ---

function abrirMenuUsuario() {
    event.preventDefault();
    document.getElementById("modal-usuario").style.display = "flex";
    document.getElementById("form-trocar-senha").style.display = "none";
    document.getElementById("menu-opcoes").style.display = "flex";
}

function fecharMenuUsuario() {
    document.getElementById("modal-usuario").style.display = "none";
}

function mostrarFormSenha() {
    document.getElementById("menu-opcoes").style.display = "none";
    document.getElementById("form-trocar-senha").style.display = "flex";
}

function voltarMenuOpcoes() {
    document.getElementById("form-trocar-senha").style.display = "none";
    document.getElementById("menu-opcoes").style.display = "flex";
    document.getElementById("nova-senha").value = "";
}

// Atualiza a senha no localStorage
function atualizarSenha(event) {
    event.preventDefault();
    let novaSenha = document.getElementById("nova-senha").value;
    let usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    let usuariosCadastrados = JSON.parse(localStorage.getItem("meusUsuarios")) || [];

    // Atualiza na lista geral de cadastros
    let usuarioEncontrado = usuariosCadastrados.find(u => u.email === usuarioLogado.email);
    if (usuarioEncontrado) {
        usuarioEncontrado.senha = novaSenha;
        localStorage.setItem("meusUsuarios", JSON.stringify(usuariosCadastrados));
    }

    // Atualiza a sessão atual
    usuarioLogado.senha = novaSenha;
    localStorage.setItem("usuarioLogado", JSON.stringify(usuarioLogado));

    alert("Senha alterada com sucesso!");
    fecharMenuUsuario();
}

// Realiza o logout (desconecta o usuário)
function fazerLogout() {
    localStorage.removeItem("usuarioLogado");
    alert("Você saiu da sua conta com sucesso.");
    fecharMenuUsuario();

    // Restaura o link do header para o estado original (Entrar/Registrar)
    let linkUsuario = document.getElementById("link-usuario");
    if (linkUsuario) {
        linkUsuario.innerHTML = "&#128100; Entrar/Registrar";
        linkUsuario.setAttribute("onclick", "abrirAuth()");
    }
}

