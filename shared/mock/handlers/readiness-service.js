window.BANCA = window.BANCA || {};
BANCA.productState = (prod, p = BANCA.current()) => prod.state[p] || 'HIDDEN';
BANCA.visibleProducts = () => BANCA.products.filter(x => x.visible.includes(BANCA.current()));
BANCA.capabilities = prod => prod.caps[BANCA.productState(prod)] || [];
