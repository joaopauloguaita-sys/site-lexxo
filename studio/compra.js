/* Lexxo Studio: oferta, pedido com Pix e chave de licenca. Fala com o servidor (food.lexxosistemas.com.br/api/studio). */
(function () {
  'use strict';
  var CFG = window.LEXXO_STUDIO || {};
  var API = String(CFG.API || '').replace(/\/$/, '');
  var CHAVE_LS = 'lexxo_studio_pedido';
  var timer = null;

  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function mostra(el, on) { if (el) { el.hidden = !on; } }
  function texto(sel, t) { $$(sel).forEach(function (e) { e.textContent = t; }); }

  function resposta(r) {
    return r.json().catch(function () { return {}; }).then(function (j) {
      if (!r.ok) { var e = new Error(j.mensagem || 'Não deu certo. Tente de novo em instantes.'); e.status = r.status; throw e; }
      return j;
    });
  }
  function pega(caminho) { return fetch(API + caminho, { headers: { 'Accept': 'application/json' } }).then(resposta); }
  function envia(caminho, dados) {
    var b = new URLSearchParams();
    Object.keys(dados).forEach(function (k) { b.append(k, dados[k]); });
    return fetch(API + caminho, { method: 'POST', body: b, headers: { 'Accept': 'application/json' } }).then(resposta);
  }
  function guarda(t) { try { if (t) { localStorage.setItem(CHAVE_LS, t); } else { localStorage.removeItem(CHAVE_LS); } } catch (e) {} }
  function lembra() { try { return localStorage.getItem(CHAVE_LS) || ''; } catch (e) { return ''; } }

  function painel(qual) {
    ['compra-fechada', 'compra-form', 'compra-pix', 'compra-pago'].forEach(function (id) { mostra(document.getElementById(id), id === qual); });
  }

  // ---------------------------------------------------------------- oferta
  function ofertaFechada() {
    mostra($('#oferta-valores'), false); mostra($('#oferta-contagem'), false); mostra($('#oferta-breve'), true);
    painel('compra-fechada');
  }
  function oferta() {
    return pega('/oferta').then(function (o) {
      if (!o.aberto) {
        $('#oferta-breve').querySelector('.preco').textContent = 'Vendas pausadas';
        $('#oferta-breve').querySelector('.quando').textContent = 'No momento as vendas estão pausadas. Chame no WhatsApp para saber quando voltam.';
        mostra($('#oferta-valores'), false); mostra($('#oferta-contagem'), false); mostra($('#oferta-breve'), true);
        painel('compra-fechada');
        return o;
      }
      texto('[data-oferta="preco"]', o.preco_texto);
      var riscado = $('[data-oferta="normal-riscado"]');
      if (o.oferta_ativa) {
        riscado.textContent = 'de ' + o.preco_normal_texto; riscado.hidden = false;
        texto('[data-oferta="texto"]', 'Oferta de lançamento, por tempo limitado e só enquanto houver licenças.');
        var vendidas = Math.max(0, o.total - o.restantes);
        $('[data-oferta="barra"]').style.width = (o.total > 0 ? Math.round(vendidas * 100 / o.total) : 100) + '%';
        texto('[data-oferta="contagem"]', 'Restam ' + o.restantes + ' de ' + o.total + ' licenças com este preço');
        mostra($('#oferta-contagem'), true);
      } else {
        riscado.hidden = true;
        texto('[data-oferta="texto"]', 'A oferta de lançamento terminou. Este é o preço normal.');
        mostra($('#oferta-contagem'), false);
      }
      mostra($('#oferta-valores'), true); mostra($('#oferta-breve'), false);
      return o;
    });
  }

  // ---------------------------------------------------------------- pedido
  function erro(msg) { var e = $('#compra-erro'); e.textContent = msg; mostra(e, !!msg); }
  function qr(codigo) {
    try { var q = qrcode(0, 'M'); q.addData(codigo); q.make(); return q.createSvgTag({ cellSize: 6, margin: 2, scalable: true }); } catch (e) { return ''; }
  }
  function mostraPix(p) {
    texto('#pix-valor', p.valor_texto);
    $('#pix-codigo').value = p.pix_copia_cola || '';
    $('#pix-qr').innerHTML = qr(p.pix_copia_cola || '');
    painel('compra-pix');
    espera(p.token);
  }
  function mostraPago(p) {
    pare();
    texto('#chave-texto', p.chave || '');
    if (p.baixar) { var a = $('#btn-baixar'); a.href = p.baixar; a.hidden = false; texto('#passo-baixar', 'Baixe e instale o Lexxo Studio (o link também foi para o seu e-mail).'); }
    else { texto('#passo-baixar', 'O link para baixar o Lexxo Studio será enviado para o seu e-mail.'); }
    texto('#pago-email', 'Também enviamos a chave para ' + p.email + '. Se não aparecer, olhe a caixa de spam.');
    texto('#pago-reembolso', p.reembolso_ate ? 'Você pode pedir reembolso até ' + p.reembolso_ate + '.' : '');
    painel('compra-pago');
    $('#compra-pago').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function pare() { if (timer) { clearTimeout(timer); timer = null; } }
  function espera(token) {
    pare();
    timer = setTimeout(function () {
      pega('/pedido/' + encodeURIComponent(token)).then(function (p) {
        if (p.status === 'paid' && p.chave) { mostraPago(p); }
        else if (p.status === 'pending') { espera(token); }
        else { guarda(''); painel('compra-form'); erro('Este pedido não está mais ativo. Gere um novo Pix.'); }
      }).catch(function (e) {
        if (e.status === 404) { guarda(''); painel('compra-form'); return; }
        texto('#pix-status', 'Sem conexão por um instante. Tentando de novo...'); espera(token);
      });
    }, 5000);
  }
  function copia(el, botao) {
    var t = el.value !== undefined ? el.value : el.textContent;
    function ok() { var antes = botao.textContent; botao.textContent = 'Copiado!'; setTimeout(function () { botao.textContent = antes; }, 1800); }
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(t).then(ok, function () { fallback(); }); } else { fallback(); }
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) {} document.body.removeChild(ta);
    }
  }

  function inicio() {
    if (!CFG.VENDAS || !API) { ofertaFechada(); return; }
    oferta().then(function (o) {
      if (!o.aberto) { return; }
      var token = lembra();
      if (token) {
        pega('/pedido/' + encodeURIComponent(token)).then(function (p) {
          if (p.status === 'paid' && p.chave) { mostraPago(p); }
          else if (p.status === 'pending') { mostraPix(p); }
          else { guarda(''); painel('compra-form'); }
        }).catch(function () { guarda(''); painel('compra-form'); });
      } else { painel('compra-form'); }
    }).catch(function () { ofertaFechada(); });

    $('#form-compra').addEventListener('submit', function (ev) {
      ev.preventDefault(); erro('');
      var nome = $('#nome').value.trim(), email = $('#email').value.trim();
      if (nome.length < 3) { erro('Informe seu nome completo.'); $('#nome').focus(); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { erro('Informe um e-mail válido: é para ele que enviamos a chave.'); $('#email').focus(); return; }
      if (!$('#aceite').checked) { erro('Para comprar, aceite os Termos de Uso e a Política de Privacidade.'); return; }
      var btn = $('#btn-comprar'); btn.disabled = true;
      envia('/pedido', { nome: nome, email: email, aceite: '1' }).then(function (p) {
        guarda(p.token); mostraPix(p);
      }).catch(function (e) {
        erro(e.message || 'Não foi possível gerar o Pix agora. Tente de novo ou chame no WhatsApp.');
      }).then(function () { btn.disabled = false; });
    });
    $('#btn-copiar-pix').addEventListener('click', function () { copia($('#pix-codigo'), this); });
    $('#btn-copiar-chave').addEventListener('click', function () { copia($('#chave-texto'), this); });
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', inicio); } else { inicio(); }
})();
