const API_URL = "/api";

// Carrega o carrinho temporário do navegador
let carrinho = JSON.parse(localStorage.getItem("meuCarrinho")) || [];
let metodoPagamentoSelecionado = "Cartão de Crédito";

document.addEventListener("DOMContentLoaded", () => {
    atualizarContadorGlobal();
    atualizarHeaderUsuario();

    // Se estivermos na página do carrinho
    if (document.getElementById("lista-carrinho")) {
        renderizarCarrinhoPagina();
    }

    // Se estivermos na página inicial, carrega os produtos do JSON via Python
    if (document.getElementById("produtos-container")) {
        carregarProdutosDoServidor();
    }
    // Se estivermos na página de pagamento
    if (document.getElementById("form-pagamento")) {
        iniciarPaginaPagamento();
    }
});

async function carregarProdutosDoServidor() {
    try {
        let resposta = await fetch(`${API_URL}/produtos`);
        let dados = await resposta.json();

        if (dados.sucesso) {
            let container = document.getElementById("produtos-container");
            container.innerHTML = "";

            dados.produtos.forEach(produto => {
                let card = document.createElement("div");
                card.classList.add("product-card");

                // Certifique-se de que não há CSS inline forçando largura de 100% ou display block que empilhe
                card.innerHTML = `
                    <div class="product-title">${produto.nome}</div>
                    <img src="${produto.imagem}" alt="Cupcake ${produto.nome}" class="product-image">
                    <div class="product-footer">
                        <span class="product-price">R$ ${produto.preco.toFixed(2).replace('.', ',')}</span>
                        <button class="btn-buy" onclick="adicionar_carrinho('Cupcake ${produto.nome}', ${produto.preco})">Adicionar ao Carrinho</button>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
    }
}

function adicionar_carrinho(nomeProduto, preco) {
    let itemExistente = carrinho.find(item => item.nome === nomeProduto);
    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ nome: nomeProduto, preco: preco, quantidade: 1 });
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
    if (contador) contador.innerText = totalItens;
}

function exibirMensagemFeedback(nomeProduto) {
    let aviso = document.getElementById("mensagem-status");
    if (aviso) {
        aviso.innerText = nomeProduto + " foi adicionado ao carrinho!";
        setTimeout(() => { aviso.innerText = ""; }, 5000);
    }
}

function renderizarCarrinhoPagina() {
    let listaHTML = document.getElementById("lista-carrinho");
    let totalHTML = document.getElementById("valor-total");
    if (!listaHTML) return;

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
        divItem.style.cssText = "display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #eee; border-radius: 4px;";

        divItem.innerHTML = `
            <div>
                <strong>${item.nome}</strong><br>
                <small style="color: #666;">Unitário: R$ ${item.preco.toFixed(2).replace('.', ',')}</small>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
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

function aumentarQuantidade(index) { carrinho[index].quantidade++; sincronizarCarrinho(); }
function diminuirQuantidade(index) {
    if (carrinho[index].quantidade > 1) carrinho[index].quantidade--;
    else carrinho.splice(index, 1);
    sincronizarCarrinho();
}
function removerItem(index) { carrinho.splice(index, 1); sincronizarCarrinho(); }
function sincronizarCarrinho() {
    localStorage.setItem("meuCarrinho", JSON.stringify(carrinho));
    atualizarContadorGlobal();
    renderizarCarrinhoPagina();
}

// --- COMUNICAÇÃO COM O BACKEND PYTHON (FLASK) ---

// 1. Cadastrar Usuário no Python
async function cadastrarUsuario(event) {
    event.preventDefault();

    let nome = document.getElementById("reg-nome").value;
    let email = document.getElementById("reg-email").value;
    let senha = document.getElementById("reg-senha").value;

    try {
        let resposta = await fetch(`${API_URL}/cadastrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });

        let dados = await resposta.json();

        if (dados.sucesso) {
            alert(dados.mensagem);
            document.getElementById("form-registro").reset();
            alternarAba('login');
        } else {
            alert(dados.mensagem);
        }
    } catch (erro) {
        alert("Erro ao conectar com o servidor Python. O app.py está rodando?");
    }
}

// 2. Fazer Login via Python
async function fazerLogin(event) {
    event.preventDefault();

    let email = document.getElementById("login-email").value;
    let senha = document.getElementById("login-senha").value;

    try {
        let resposta = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        let dados = await resposta.json();

        if (dados.sucesso) {
            alert(`Bem-vindo(a), ${dados.usuario.nome}!`);
            localStorage.setItem("usuarioLogado", JSON.stringify(dados.usuario));
            document.getElementById("form-login").reset();
            fecharAuth();
            atualizarHeaderUsuario();
        } else {
            alert(dados.mensagem);
        }
    } catch (erro) {
        alert("Erro ao conectar com o servidor Python. O app.py está rodando?");
    }
}

// 3. No carrinho.html: Valida login/carrinho e redireciona para pagamento.html
function finalizarCompra() {
    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    let usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuarioLogado) {
        alert("Você precisa estar logado para finalizar a compra!");
        abrirAuth();
        return;
    }

    window.location.href = "pagamento.html";
}

// 4. Buscar os pedidos salvos no arquivo dados.json do Python e exibir no Modal
async function abrirMeusPedidos() {
    let usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuarioLogado) {
        alert("Você precisa estar logado para ver seus pedidos.");
        return;
    }

    try {
        let resposta = await fetch(`${API_URL}/pedidos/${usuarioLogado.email}`);
        let dados = await resposta.json();

        if (dados.sucesso) {
            let meusPedidos = dados.pedidos;
            let containerPedidos = document.getElementById("lista-pedidos-modal");
            containerPedidos.innerHTML = "";

            if (meusPedidos.length === 0) {
                containerPedidos.innerHTML = "<p style='color: #666; text-align: center; padding: 20px;'>Você ainda não realizou nenhum pedido.</p>";
            } else {
                // Dentro da função abrirMeusPedidos(), altere a parte onde monta o card do pedido:
                meusPedidos.forEach(pedido => {
                    let divPedido = document.createElement("div");
                    divPedido.style.cssText = "border: 1px solid #ddd; border-radius: 6px; padding: 12px; background: #fafafa; font-size: 13px;";
                    
                    let itensHtml = "";
                    pedido.itens.forEach(i => {
                        itensHtml += `<li style="margin-left: 15px; color: #555;">${i.quantidade}x ${i.nome} - R$ ${i.preco.toFixed(2).replace('.', ',')}</li>`;
                    });

                    divPedido.innerHTML = `
                        <div style="display: flex; justify-content: space-between; font-weight: bold; color: #a44eaa; margin-bottom: 6px;">
                            <span>Pedido #${pedido.id}</span>
                            <span style="color: #666; font-size: 12px;">${pedido.data}</span>
                        </div>
                        <div style="margin-bottom: 8px; font-size: 12px; color: #444;">
                            💳 Forma de Pagamento: <strong>${pedido.formaPagamento || 'Cartão de Crédito'}</strong>
                        </div>
                        <ul style="margin-bottom: 8px;">${itensHtml}</ul>
                        <div style="text-align: right; font-weight: bold; color: #333; border-top: 1px solid #eee; padding-top: 6px;">
                            Total: R$ ${pedido.total.toFixed(2).replace('.', ',')}
                        </div>
                    `;
                    containerPedidos.appendChild(divPedido);
                });
            }

            // Exibe o modal personalizado
            document.getElementById("modal-pedidos").style.display = "flex";
        }
    } catch (erro) {
        alert("Erro ao buscar seus pedidos no servidor.");
    }
}

function fecharMeusPedidos() {
    document.getElementById("modal-pedidos").style.display = "none";
}

// 5. Trocar Senha via Python
async function atualizarSenha(event) {
    event.preventDefault();
    let novaSenha = document.getElementById("nova-senha").value;
    let usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));

    try {
        let resposta = await fetch(`${API_URL}/trocar-senha`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: usuarioLogado.email, novaSenha: novaSenha })
        });

        let dados = await resposta.json();
        alert(dados.mensagem);
        if (dados.sucesso) fecharMenuUsuario();
    } catch (erro) {
        alert("Erro ao atualizar senha no servidor.");
    }
}

// Auxiliares do Modal e Interface
function abrirAuth() {
    if (typeof event !== 'undefined' && event) event.preventDefault();
    let modal = document.getElementById("modal-auth");
    if (modal) {
        modal.style.display = "flex";
    } else {
        console.error("Modal de auth não encontrado no HTML!");
    }
}
function fecharAuth() { document.getElementById("modal-auth").style.display = "none"; }
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
function atualizarHeaderUsuario() {
    let usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    let linkUsuario = document.getElementById("link-usuario");
    if (linkUsuario && usuarioLogado) {
        linkUsuario.innerHTML = `👤 Olá, ${usuarioLogado.nome.split(' ')[0]}`;
        linkUsuario.setAttribute("onclick", "abrirMenuUsuario()");
    }
}
function abrirMenuUsuario() {
    if (typeof event !== 'undefined' && event) event.preventDefault();
    document.getElementById("modal-usuario").style.display = "flex";
    document.getElementById("form-trocar-senha").style.display = "none";
    document.getElementById("menu-opcoes").style.display = "flex";
}
function fecharMenuUsuario() { document.getElementById("modal-usuario").style.display = "none"; }
function mostrarFormSenha() {
    document.getElementById("menu-opcoes").style.display = "none";
    document.getElementById("form-trocar-senha").style.display = "flex";
}
function voltarMenuOpcoes() {
    document.getElementById("form-trocar-senha").style.display = "none";
    document.getElementById("menu-opcoes").style.display = "flex";
    document.getElementById("nova-senha").value = "";
}
function fazerLogout() {
    localStorage.removeItem("usuarioLogado");
    alert("Você saiu da sua conta com sucesso.");
    fecharMenuUsuario();
    let linkUsuario = document.getElementById("link-usuario");
    if (linkUsuario) {
        linkUsuario.innerHTML = "&#128100; Entrar/Registrar";
        linkUsuario.setAttribute("onclick", "abrirAuth()");
    }
}

// --- FUNÇÕES DA PÁGINA DE PAGAMENTO ---

function iniciarPaginaPagamento() {
    let usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuarioLogado || carrinho.length === 0) {
        window.location.href = "carrinho.html";
        return;
    }

    let totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    let valorTotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

    document.getElementById("qtd-itens-resumo").innerText = totalItens;
    document.getElementById("total-pagamento").innerText = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
}

function selecionarMetodo(metodo) {
    metodoPagamentoSelecionado = metodo;

    document.getElementById("opt-credito").classList.toggle("active", metodo === "Cartão de Crédito");
    document.getElementById("opt-debito").classList.toggle("active", metodo === "Cartão de Débito");
    document.getElementById("opt-pix").classList.toggle("active", metodo === "Pix");

    const camposCartao = document.getElementById("campos-cartao");
    const camposPix = document.getElementById("campos-pix");
    const inputsCartao = camposCartao.querySelectorAll("input");

    if (metodo === "Pix") {
        camposCartao.style.display = "none";
        camposPix.style.display = "flex";
        inputsCartao.forEach(input => input.required = false);
    } else {
        camposCartao.style.display = "flex";
        camposPix.style.display = "none";
        inputsCartao.forEach(input => input.required = true);
    }
}

async function confirmarPagamento(event) {
    event.preventDefault();

    let usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    let valorTotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

    try {
        let resposta = await fetch(`${API_URL}/pedidos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clienteEmail: usuarioLogado.email,
                clienteNome: usuarioLogado.nome,
                itens: carrinho,
                total: valorTotal,
                formaPagamento: metodoPagamentoSelecionado
            })
        });

        let dados = await resposta.json();

        if (dados.sucesso) {
            let p = dados.pedido;
            alert(`🎉 Pagamento via ${metodoPagamentoSelecionado} aprovado!\n\nNúmero do Pedido: #${p.id}\nValor Total: R$ ${p.total.toFixed(2).replace('.', ',')}\n\nObrigado por comprar na Cupcake!`);

            carrinho = [];
            localStorage.removeItem("meuCarrinho");
            window.location.href = "index.html";
        } else {
            alert(dados.mensagem);
        }
    } catch (erro) {
        alert("Erro ao processar o pagamento no servidor.");
    }
}
