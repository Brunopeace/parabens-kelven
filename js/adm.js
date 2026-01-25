    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
    import { getDatabase, ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

    // 1. Configuração do Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyDZII2LWg1D4usoWiWtwrvHsi--YxKSo3c",
        authDomain: "salgadosdelicia-b0032.firebaseapp.com",
        databaseURL: "https://salgadosdelicia-b0032-default-rtdb.firebaseio.com",
        projectId: "salgadosdelicia-b0032",
        storageBucket: "salgadosdelicia-b0032.firebasestorage.app",
        messagingSenderId: "273362591423",
        appId: "1:273362591423:web:1b179a8b9003df8d33300a"
    };

    // 2. Inicialização
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const container = document.getElementById('lista-pedidos-container');
    
      // Escutar Pedidos em Tempo Real
  onValue(ref(db, 'pedidos'), (snapshot) => {
    const pedidos = snapshot.val();
    container.innerHTML = ""; 

    if (!pedidos) {
        container.innerHTML = "<p style='text-align:center; padding:20px;'>Aguardando novos pedidos...</p>";
        document.getElementById('painel-status').innerText = "Painel Ativo";
        return;
    }

    for (let id in pedidos) {
      const p = pedidos[id];
      
      // PROTEÇÃO: Verifica se 'itens' existe antes de tentar usar .map ou .length
      const itensSeguros = p.itens || []; 
      
      const listaItens = itensSeguros.map(item => {
          // Verifica se 'extras' existe dentro do item
          const extrasSeguros = item.extras || [];
          return `<li>${item.nome} ${extrasSeguros.length > 0 ? `<small>(${extrasSeguros.join(', ')})</small>` : ''}</li>`;
      }).join('');

      const card = document.createElement('div');
      card.className = `order-card ${p.status === 2 ? 'finalizado' : ''}`;
      
      card.innerHTML = `
        <div class="pedido-info">
            <h3>#${id.slice(-4)} - ${(p.cliente || 'Sem Nome').toUpperCase()}</h3>
            <p><strong>📞 Tel:</strong> ${p.telefone || 'Não informado'}</p>
            <ul class="lista-itens-detalhe">
                ${listaItens || '<li>Nenhum item detalhado</li>'}
            </ul>
            <p class="total-pedido">Total: R$ ${(p.total || 0).toFixed(2)}</p>
        </div>

        <div class="status-group">
            <button onclick="mudarStatus('${id}', 1)" class="btn-status btn-prep">Preparar</button>
            <button onclick="mudarStatus('${id}', 2)" class="btn-status btn-ready">Entregar</button>
            <button onclick="excluirPedido('${id}')" class="btn-status btn-cancel">Excluir</button>
        </div>

        <div class="whatsapp-tools">
            <button class="btn-status btn-wa" onclick="avisarWA('${p.telefone}', '${p.cliente}', 'preparo')">
                <i class="fab fa-whatsapp"></i> No Fogo
            </button>
            <button class="btn-status btn-wa" onclick="avisarWA('${p.telefone}', '${p.cliente}', 'pronto')">
                <i class="fab fa-whatsapp"></i> Saiu Entrega
            </button>
        </div>
      `;
      container.appendChild(card);
    }
  });


    // 4. Funções Globais expostas para os botões do Firebase
    window.mudarStatus = (id, novoStatus) => {
        update(ref(db, `pedidos/${id}`), { status: novoStatus });
    };

    window.excluirPedido = (id) => {
        if (confirm("Deseja finalizar este pedido e removê-lo do painel?")) {
            remove(ref(db, `pedidos/${id}`));
        }
    };

    // 5. Função de WhatsApp adaptada para múltiplos pedidos
    window.avisarWA = (telefone, nome, tipo) => {
        // Limpa o número de telefone
        let numeroLimpo = telefone.replace(/\D/g, '');
        if (numeroLimpo.length <= 11) numeroLimpo = "55" + numeroLimpo;

        let msg = "";
const nomeLoja = "*Salgados Delícia* 🥟";

if (tipo === 'preparo') {
    msg = `*BOAS NOTÍCIAS, ${nome.toUpperCase()}!* 🎉\n\n` +
          `Seu pedido já está nas mãos dos nossos chefes e *começou a ser preparado!* 🔥\n\n` +
          `Logo ele sairá daqui quentinho para você. Fique atento! 🥟✨\n\n` +
          `Agradecemos a preferência, ${nomeLoja}`;
          
} else if (tipo === 'pronto') {
    msg = `*SEU PEDIDO ESTÁ A CAMINHO!* 🛵💨\n\n` +
          `Prepare a mesa, ${nome}! O entregador acabou de sair com seus salgados super quentinhos e crocantes. 😍\n\n` +
          `Em poucos minutos bateremos aí na sua porta!\n\n` +
          `Bom apetite, ${nomeLoja}`;
}

        
        window.open(`https://wa.me/${numeroLimpo}?text=${encodeURIComponent(msg)}`, '_blank');
    };