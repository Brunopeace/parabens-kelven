import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyDZII2LWg1D4usoWiWtwrvHsi--YxKSo3c",
    authDomain: "salgadosdelicia-b0032.firebaseapp.com",
    databaseURL: "https://salgadosdelicia-b0032-default-rtdb.firebaseio.com",
    projectId: "salgadosdelicia-b0032",
    storageBucket: "salgadosdelicia-b0032.firebasestorage.app",
    messagingSenderId: "273362591423",
    appId: "1:273362591423:web:1b179a8b9003df8d33300a"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- ESTADO DO CARRINHO ---
let carrinho = [];
const SEU_TELEFONE = "5581982258462";

// --- FUNÇÕES DO CARRINHO (EXPORTADAS PARA WINDOW) ---

window.adicionarAoCarrinho = function(nome, preco, temExtras, botao) {
    let extras = [];
    if(temExtras) {
        const card = botao.closest('.card');
        const checkboxes = card.querySelectorAll('.extra:checked');
        checkboxes.forEach(c => {
            extras.push(c.value);
            c.checked = false; 
        });
    }

    carrinho.push({ nome, preco, extras });
    
    const cartTrigger = document.querySelector('.cart-trigger');
    cartTrigger.classList.add('cart-bump');
    setTimeout(() => cartTrigger.classList.remove('cart-bump'), 400);

    atualizarInterface();
    mostrarPopup(nome);
};

window.removerItem = function(index) {
    carrinho.splice(index, 1);
    atualizarInterface();
};

window.limparRadios = function(botao) {
    const card = botao.closest('.card');
    const radios = card.querySelectorAll('input[type="radio"]');
    radios.forEach(r => r.checked = false);
}

function atualizarInterface() {
    const cartCount = document.getElementById('cart-count');
    if(cartCount) cartCount.innerText = carrinho.length;
    
    const lista = document.getElementById('itens-lista');
    const totalE = document.getElementById('total-val');
    
    // Referências dos elementos que vamos mostrar/esconder
    const pixBox = document.querySelector('.pix-box');
    const totalContainer = document.querySelector('.total-container');
    const btnWhats = document.querySelector('.btn-whats');
    const identificacao = document.querySelector('.identificacao-cliente');

    if(!lista || !totalE) return;

    lista.innerHTML = "";
    let total = 0;

    if(carrinho.length === 0) {
        lista.innerHTML = `
            <div style='text-align:center; padding: 40px 20px;'>
                <i class="fas fa-shopping-basket" style="font-size: 3rem; color: #e4e4e7; margin-bottom: 15px;"></i>
                <p style='color:#71717a; font-weight: 500;'>Seu carrinho está vazio... 😭</p>
                <button onclick="toggleCart()" style="margin-top: 15px; background: #D97706; color: white; border: none; padding: 8px 20px; border-radius: 20px; cursor: pointer;">IR PARA O CARDÁPIO</button>
            </div>
        `;
        
        // Esconde os elementos de checkout se estiver vazio
        if(pixBox) pixBox.style.display = 'none';
        if(totalContainer) totalContainer.style.display = 'none';
        if(btnWhats) btnWhats.style.display = 'none';
        if(identificacao) identificacao.style.display = 'none';

    } else {
        // Mostra os elementos de checkout se houver itens
        if(pixBox) pixBox.style.display = 'block';
        if(totalContainer) totalContainer.style.display = 'flex';
        if(btnWhats) btnWhats.style.display = 'flex';
        if(identificacao) identificacao.style.display = 'flex';

        carrinho.forEach((item, index) => {
            total += item.preco;
            lista.innerHTML += `
                <div class="item-carrinho" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f4f4f5;">
                    <div>
                        <strong style="color: #18181b;">${item.nome}</strong><br>
                        <small style="color: #71717a;">${item.extras.length > 0 ? item.extras.join(', ') : 'Sem opcionais'}</small>
                    </div>
                    <div class="item-acoes" style="display: flex; align-items: center; gap: 15px;">
                        <span style="font-weight: 600; color: #18181b;">R$ ${item.preco.toFixed(2)}</span>
                        <button onclick="removerItem(${index})" style="color:#ef4444; border:none; background:#fee2e2; width: 30px; height: 30px; border-radius: 50%; cursor:pointer; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    totalE.innerText = `R$ ${total.toFixed(2)}`;
}


// Função para atualizar o preço na tela quando mudar o sabor (Opcional)
document.getElementById('sabor-pastel')?.addEventListener('change', function() {
    const select = this;
    const preco = select.options[select.selectedIndex].getAttribute('data-preco');
    document.getElementById('preco-dinamico').innerText = `R$ ${parseFloat(preco).toFixed(2)}`;
});

window.adicionarPastelDinamico = function(botao) {
    const card = botao.closest('.card');
    const selectSabor = card.querySelector('#sabor-pastel');
    
    // 1. Captura o nome do sabor selecionado no <select>
    const nomeSabor = selectSabor.value;
    
    // 2. Captura o preço (convertendo de string para número)
    const precoSabor = parseFloat(selectSabor.options[selectSabor.selectedIndex].getAttribute('data-preco'));
    
    // 3. Captura os adicionais (radios marcados)
    const extras = [];
    card.querySelectorAll('.extra:checked').forEach(el => extras.push(el.value));

    // 4. Adiciona ao array global do carrinho
    carrinho.push({
        nome: nomeSabor,
        preco: precoSabor,
        extras: extras
    });

    // 5. Atualiza o contador e a lista do carrinho
    atualizarInterface();
    
    // 6. CHAMA A SUA FUNÇÃO DE POPUP PASSANDO O NOME DO SABOR
    mostrarPopup(nomeSabor);

    // 7. Feedback visual extra no próprio botão
    const textoOriginal = botao.innerText;
    botao.innerText = "Adicionado! ✅";
    botao.disabled = true; // Evita cliques duplos rápidos
    
    setTimeout(() => {
        botao.innerText = textoOriginal;
        botao.disabled = false;
    }, 1500);
};

// --- INTERFACE E POPUPS ---

function mostrarPopup(nome) {
    const container = document.getElementById('toast-container');
    if(!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> <span><strong>${nome}</strong> Adicionado ao carrinho!</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

window.toggleCart = function() {
    document.getElementById('modal-cart').classList.toggle('active');
};

window.toggleStatus = function() {
    document.getElementById('modal-status').classList.toggle('active');
};

window.copiarPix = function() {
    const chave = document.getElementById('chave-pix').innerText;
    navigator.clipboard.writeText(chave).then(() => {
        alert("Chave Pix copiada com sucesso!");
    });
};

// Verifica se existe alguma bebida no carrinho
function temBebida() {
    return carrinho.some(item => 
        item.nome.toLowerCase().includes('coca') || 
        item.nome.toLowerCase().includes('refri') || 
        item.nome.toLowerCase().includes('lata') || 
        item.nome.toLowerCase().includes('suco')
    );
}

// Caso o cliente aceite a sugestão
window.adicionarBebidaESeguir = function() {
    // Adiciona a bebida (ajuste o nome e preço se desejar)
    carrinho.push({ nome: "Coca-Cola Lata", preco: 6.00, extras: ["Super Gelada"] });
    atualizarInterface();
    document.getElementById('modal-sugestao').classList.remove('active');
    
    // Pequeno delay para atualizar o total e enviar
    setTimeout(() => {
        window.enviarPedidoZap(); 
    }, 300);
};

// Caso o cliente recuse a sugestão
window.ignorarSugestao = function() {
    document.getElementById('modal-sugestao').classList.remove('active');
    // Marcamos uma flag temporária para não perguntar de novo nesta tentativa
    window.pulouSugestao = true;
    window.enviarPedidoZap();
};

// --- FUNÇÃO PRINCIPAL DE ENVIO ---

window.enviarPedidoZap = function() {
    const nomeCliente = document.getElementById('cliente-nome').value.trim();
    const telCliente = document.getElementById('cliente-tel').value.trim();

    // 1. Validações Iniciais
    if(carrinho.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }
    if(nomeCliente === "" || telCliente === "") {
        alert("Por favor, preencha seu nome e telefone.");
        return;
    }

    // 2. LÓGICA DE SUGESTÃO (CROSS-SELL)
    // Se não tem bebida E ainda não pulou a sugestão, mostra o modal
    if (!temBebida() && !window.pulouSugestao) {
        document.getElementById('modal-sugestao').classList.add('active');
        return; // Interrompe o envio para esperar a decisão
    }

    // 3. SE CHEGOU AQUI, PROCESSA O ENVIO FINAL
    const totalCalculado = carrinho.reduce((acc, item) => acc + item.preco, 0);

    // Objeto para o Firebase
    const pedidoData = {
        cliente: nomeCliente,
        telefone: telCliente,
        itens: carrinho,
        total: totalCalculado,
        status: 0, 
        data: new Date().toLocaleString()
    };

    // Salvar no Firebase
    const listaRef = ref(db, 'pedidos');
    const novoPedidoRef = push(listaRef);
    const pedidoId = novoPedidoRef.key;

    set(novoPedidoRef, pedidoData).then(() => {
        // Persistência Local para Rastreio
        localStorage.setItem('meuPedidoId', pedidoId);
        localStorage.setItem('pedidoAtivo', 'true');
        
        // Reset da flag de sugestão para o próximo pedido futuro
        window.pulouSugestao = false;

        // Formatar mensagem WhatsApp (Com Emojis Hexadecimais para evitar erro de código)
        let texto = `*NOVO PEDIDO #${pedidoId.slice(-4)}*\n`;
        texto += `\uD83D\uDC64 *Cliente:* ${nomeCliente}\n`;
        texto += `----------------------------------\n\n`;
        
        carrinho.forEach(item => {
            texto += `\u2705 *${item.nome}*\n`;
            if(item.extras.length > 0) texto += `   _Op\u00E7\u00F5es: ${item.extras.join(', ')}_\n`;
            texto += `   Pre\u00E7o: R$ ${item.preco.toFixed(2)}\n\n`;
        });
        
        texto += `----------------------------------\n`;
        texto += `*TOTAL: R$ ${totalCalculado.toFixed(2)}*\n`;
        texto += `*PAGAMENTO:* Pix\n\n`;
        texto += `_Rastreie seu pedido clicando no bot\u00E3o 'Acompanhar Pedido' no site!_`;
        
        exibirBotaoTrack();
        window.open(`https://wa.me/${SEU_TELEFONE}?text=${encodeURIComponent(texto)}`, '_blank');
        
        // Limpar interface
        carrinho = [];
        atualizarInterface();
        if(document.getElementById('modal-cart')) document.getElementById('modal-cart').classList.remove('active');
        
        // Iniciar monitoramento do status imediatamente
        monitorarMeuPedido();

    }).catch(err => {
        alert("Erro ao enviar pedido: " + err.message);
    });
};

// --- RASTREIO REAL-TIME ---

function exibirBotaoTrack() {
    const btnTrack = document.getElementById('btn-track');
    if (localStorage.getItem('pedidoAtivo') === 'true') {
        if(btnTrack) btnTrack.style.display = 'block';
    }
}

function monitorarMeuPedido() {
    const meuId = localStorage.getItem('meuPedidoId');
    if (!meuId) {
        // Se não tem ID, garante que o botão suma
        const btnTrack = document.getElementById('btn-track');
        if(btnTrack) btnTrack.style.display = 'none';
        return;
    }

    const pedidoRef = ref(db, `pedidos/${meuId}`);
    
    // Monitora o pedido completo
    onValue(pedidoRef, (snapshot) => {
        const dados = snapshot.val();

        // SE O PEDIDO NÃO EXISTE MAIS NO FIREBASE (Você excluiu no painel)
        if (!dados) {
            localStorage.removeItem('meuPedidoId');
            localStorage.removeItem('pedidoAtivo');
            
            // Esconde os elementos de rastreio
            document.getElementById('btn-track').style.display = 'none';
            document.getElementById('modal-status').classList.remove('active');
            document.getElementById('com-pedido').style.display = 'none';
            document.getElementById('sem-pedido').style.display = 'block';
            return;
        }

        // SE O PEDIDO EXISTE, ATUALIZA OS STATUS
        document.getElementById('sem-pedido').style.display = 'none';
        document.getElementById('com-pedido').style.display = 'block';
        document.getElementById('btn-track').style.display = 'block';

        const stepPreparo = document.getElementById('step-preparo');
        const stepEntrega = document.getElementById('step-entrega');

        // Reseta classes e aplica conforme o status no banco
        stepPreparo?.classList.remove('active');
        stepEntrega?.classList.remove('active');

        if (dados.status >= 1) stepPreparo?.classList.add('active');
        if (dados.status >= 2) stepEntrega?.classList.add('active');
    });
}



function verificarHorario() {
    const agora = new Date();
    const hora = agora.getHours();
    const bloqueioManual = localStorage.getItem('lojaBloqueada') === 'true';
    const horarioPermitido = hora >= 17 && hora < 19;
    const estaAberto = horarioPermitido && !bloqueioManual;

    const banner = document.getElementById('status-loja');
    const titulo = document.querySelector('.status-title');
    const subtitulo = document.querySelector('.status-subtitle');
    const botoes = document.querySelectorAll('.btn-add');

    if (!estaAberto) {
        if (banner) banner.style.display = 'flex'; 
        
        if (bloqueioManual) {
            if (titulo) titulo.innerText = "Pausa Temporária";
            if (subtitulo) subtitulo.innerText = "Houve um imprevisto operacional. Voltaremos em breve! 🙏";
            if (banner) banner.style.background = "linear-gradient(135deg, #78350f 0%, #451a03 100%)";
        } else {
            if (titulo) titulo.innerText = "Loja Fechada";
            if (subtitulo) subtitulo.innerText = "Abriremos das 17:00 às 23:00!";
            if (banner) banner.style.background = ""; 
        }
        
        botoes.forEach(btn => {
            btn.classList.add('btn-disabled');
            btn.innerText = "Fechado agora";
            // Adicionamos o CSS para bloquear o clique mas permitir o "shake"
            btn.style.pointerEvents = "none"; 
            
            // Se o usuário clicar no card ou na área do botão, mostramos o erro
            btn.parentElement.onclick = () => {
                if(!estaAberto && banner) {
                    banner.classList.remove('shake-active');
                    void banner.offsetWidth; 
                    banner.classList.add('shake-active');
                }
            };
        });
    } else {
        // --- LOJA ABERTA ---
        if (banner) banner.style.display = 'none';
        botoes.forEach(btn => {
            btn.classList.remove('btn-disabled');
            btn.innerText = "Adicionar";
            btn.style.pointerEvents = "auto"; // Libera o clique
            btn.parentElement.onclick = null; // Remove a trava do card
        });
    }
}

// Chame a função
document.addEventListener('DOMContentLoaded', verificarHorario);

// Verifica novamente a cada 30 segundos (caso o horário mude enquanto o usuário navega)
setInterval(verificarHorario, 30000);

// Inicialização
window.onload = () => {
    exibirBotaoTrack();
    atualizarInterface();
    monitorarMeuPedido();
};