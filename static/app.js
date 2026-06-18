document.addEventListener('DOMContentLoaded', () => {
    // Reload logic for logo click
    const logoArea = document.querySelector('.logo-area');
    if (logoArea) {
        logoArea.addEventListener('click', () => {
            if (window.location.pathname !== '/' && window.location.pathname !== '') {
                window.location.href = '/';
            } else {
                window.location.reload();
            }
        });
    }

    // Theme Toggle Logic (Light / Dark mode)
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleIcon = document.getElementById('theme-toggle-icon');
    
    // Check saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeToggleIcon) themeToggleIcon.textContent = '☀️';
    }
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            if (themeToggleIcon) {
                themeToggleIcon.textContent = isDark ? '☀️' : '🌙';
            }
            // Icon animation
            if (themeToggleIcon) {
                themeToggleIcon.style.display = 'inline-block';
                themeToggleIcon.style.transform = 'scale(1.25) rotate(360deg)';
                themeToggleIcon.style.transition = 'transform 0.4s ease';
                setTimeout(() => {
                    themeToggleIcon.style.transform = 'none';
                }, 400);
            }
        });
        
        // Hover scaling
        themeToggleBtn.addEventListener('mouseenter', () => {
            themeToggleBtn.style.transform = 'scale(1.08)';
        });
        themeToggleBtn.addEventListener('mouseleave', () => {
            themeToggleBtn.style.transform = 'none';
        });
    }

    let activeMethodology = 'C';
    let currentSnomedDiag = null;
    let activeSnomedSubtab = 'pharmacotherapy';

    const methodologyBtns = document.querySelectorAll('.methodology-btn');
    methodologyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            methodologyBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeMethodology = btn.dataset.methodology;
            if (currentSnomedDiag) {
                showDiagnosisDetails(currentSnomedDiag);
            }
        });
    });

    // DOM Elements Mapping
    const catalogSearchInput = document.getElementById('catalog-search-input');
    const btnCatalogSearch = document.getElementById('btn-catalog-search');
    const statsWidget = document.getElementById('stats-widget');
    const toolbar = document.getElementById('toolbar');
    const clearSearchBtn = document.getElementById('clear-search');
    const resultsCountBadge = document.getElementById('results-count-badge');
    
    const loadingSpinner = document.getElementById('loading-spinner');
    const placeholderView = document.getElementById('placeholder-view');
    const noResultsView = document.getElementById('no-results-view');
    const viewerContent = document.getElementById('viewer-content');
    
    // Prescription DOM Elements
    const prescriptionToggleBtn = document.getElementById('prescription-toggle-btn');
    const prescriptionOverlay = document.getElementById('prescription-overlay');
    const prescriptionPanel = document.getElementById('prescription-panel');
    const closePrescriptionBtn = document.getElementById('close-prescription-btn');
    const prescriptionBody = document.getElementById('prescription-body');
    const cartBadgeCount = document.getElementById('cart-badge-count');
    const printPrescriptionReceipt = document.getElementById('print-prescription-receipt');
    
    // SNOMED Sub-tabs DOM Elements
    const subtabsContainer = document.getElementById('snomed-sub-tabs-container');
    const subtabPharmacotherapyBtn = document.getElementById('subtab-pharmacotherapy');
    const subtabClinicalSupportBtn = document.getElementById('subtab-clinical-support');
    const subtabPriceHistoryBtn = document.getElementById('subtab-price-history');
    const snomedPharmacotherapyView = document.getElementById('snomed-pharmacotherapy-view');
    const snomedClinicalSupportView = document.getElementById('snomed-clinical-support-view');
    const snomedPriceHistoryView = document.getElementById('snomed-price-history-view');
    
    // Price History Dashboard DOM Elements
    const pathologyInflationBadge = document.getElementById('pathology-inflation-badge');
    const priceChartDrugSelector = document.getElementById('price-chart-drug-selector');
    const priceChartPresentationSelector = document.getElementById('price-chart-presentation-selector');
    const priceDivergencePanel = document.getElementById('price-divergence-panel');
    const divergencePercentage = document.getElementById('divergence-percentage');
    const divergenceSaving = document.getElementById('divergence-saving');
    
    // SNOMED Modal Chart DOM Elements
    const btnShowModalChart = document.getElementById('btn-show-modal-chart');
    const btnCloseModalChart = document.getElementById('btn-close-modal-chart');
    const snomedModalChartContainer = document.getElementById('snomed-modal-chart-container');
    
    // Chart.js global instance holders
    let priceHistoryChartInstance = null;
    let snomedModalChartInstance = null;
    
    // Coverage DOM Elements
    const coverageInput = document.getElementById('coverage-percentage-input');
    const shortcutButtons = document.querySelectorAll('.btn-shortcut');
    
    // Global State
    let allProducts = [];             // Raw flat list of products for the selected pathology
    let activePathologyDesc = "";
    let currentSearchQuery = "";      // Current query for search highlighting
    let coberturaPorcentaje = 100;    // Health insurance coverage percentage (0-100)
    
    // Load Prescription Cart from localStorage
    let prescriptionCart = [];
    try {
        const savedCart = localStorage.getItem('alfabeta_prescription');
        if (savedCart) {
            prescriptionCart = JSON.parse(savedCart);
        }
    } catch (e) {
        console.error("Error al cargar carrito desde localStorage:", e);
    }
    
    // Load Coverage from localStorage or default
    try {
        const savedCoverage = localStorage.getItem('alfabeta_coverage');
        if (savedCoverage !== null) {
            coberturaPorcentaje = parseInt(savedCoverage, 10);
            if (isNaN(coberturaPorcentaje) || coberturaPorcentaje < 0 || coberturaPorcentaje > 100) {
                coberturaPorcentaje = 100;
            }
            if (coverageInput) {
                coverageInput.value = coberturaPorcentaje;
                // Update shortcut button active class
                shortcutButtons.forEach(btn => {
                    if (parseInt(btn.dataset.value, 10) === coberturaPorcentaje) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                });
            }
        }
    } catch (e) {
        console.error("Error al cargar cobertura:", e);
    }
    
    // 1. Initial Load: Start with prescription cart UI update
    updatePrescriptionCartUI();

    // Check for SSR Pre-rendered data hydration
    if (window.PRE_RENDERED_DATA) {
        allProducts = window.PRE_RENDERED_DATA;
        if (catalogSearchInput) {
            catalogSearchInput.value = window.PRE_RENDERED_QUERY || '';
        }
        if (clearSearchBtn && window.PRE_RENDERED_QUERY) {
            clearSearchBtn.style.display = 'block';
        }
        if (placeholderView) {
            placeholderView.style.display = 'none';
        }
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }
        processAndRender(allProducts);
    }

    // 2. Main Catalog Search logic
    function performCatalogSearch() {
        if (!catalogSearchInput) return;
        const query = catalogSearchInput.value.trim();
        if (!query || query.length < 2) {
            showToast("Ingresa al menos 2 caracteres para buscar.");
            return;
        }

        currentSearchQuery = query.toLowerCase();
        if (clearSearchBtn) {
            clearSearchBtn.style.display = 'block';
        }

        // Show Loading State
        showLoadingState();

        // Fetch products matching the text query from the DB search endpoint
        fetch(`/api/products/search?q=${encodeURIComponent(query)}`)
            .then(response => {
                if (!response.ok) throw new Error('Error al realizar la búsqueda');
                return response.json();
            })
            .then(products => {
                allProducts = products;
                
                if (allProducts.length === 0) {
                    showPlaceholderView("⚠️ Sin Coincidencias", `No se encontraron medicamentos en el catálogo que coincidan con "${query}".`);
                    return;
                }
                
                // Update stats widget dynamically with matching products count
                updateStats(allProducts);
                
                // Render products list
                processAndRender(allProducts);
                
                // Update cart UI reference updates if any
                updatePrescriptionCartUI();

                // Smooth scroll to results on mobile devices
                if (window.innerWidth <= 900) {
                    const resultsPanel = document.querySelector('.results-panel');
                    if (resultsPanel) {
                        resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            })
            .catch(err => {
                console.error(err);
                showPlaceholderView("❌ Error", "Ocurrió un error al consultar la base de datos.");
            });
    }

    if (btnCatalogSearch) {
        btnCatalogSearch.addEventListener('click', performCatalogSearch);
    }
    if (catalogSearchInput) {
        catalogSearchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                performCatalogSearch();
            }
        });
    }

    // Helper to trigger search from any element
    function triggerSearch(queryText) {
        if (catalogSearchInput) {
            catalogSearchInput.value = queryText;
        }
        if (clearSearchBtn) {
            clearSearchBtn.style.display = 'block';
        }
        currentSearchQuery = queryText.trim().toLowerCase();
        
        try {
            closeSnomedModal();
        } catch (err) {
            // modal might not be initialized yet
        }
        
        performCatalogSearch();
    }

    // Bind popular drug pills clicks
    const popularPills = document.querySelectorAll('.popular-drug-pill');
    popularPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const drug = pill.dataset.drug;
            if (drug) {
                triggerSearch(drug);
            }
        });
    });

    // Debounce helper
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 3. Input change listener to show/hide the clear button as the user types
    if (catalogSearchInput) {
        catalogSearchInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (val.length > 0) {
                if (clearSearchBtn) clearSearchBtn.style.display = 'block';
            } else {
                if (clearSearchBtn) clearSearchBtn.style.display = 'none';
            }
        });
    }

    // Clear Search Action
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (catalogSearchInput) {
                catalogSearchInput.value = '';
                catalogSearchInput.focus();
            }
            currentSearchQuery = '';
            clearSearchBtn.style.display = 'none';
            
            // Restore placeholder view
            showPlaceholderView(
                "Visualizador Listo", 
                "Buscá tu medicamento ingresando su nombre, droga activa, laboratorio o síntoma en la barra de búsqueda superior para comenzar a comparar precios y ahorrar."
            );
            
            // Hide statistics card and toolbar
            if (statsWidget) statsWidget.style.display = 'none';
            if (toolbar) toolbar.style.display = 'none';
            
            // If on a subpage, update URL to home without reloading
            if (window.location.pathname !== '/' && window.location.pathname !== '') {
                window.history.pushState({}, '', '/');
            }
        });
    }

    function updateStats(products) {
        let uniqueDrugs = new Set();
        let uniqueActions = new Set();
        products.forEach(p => {
            uniqueDrugs.add(p.drug_name);
            uniqueActions.add(p.action_name);
        });
        
        const statProdsEl = document.querySelector('#stat-products .stat-number');
        const statDrugsEl = document.querySelector('#stat-drugs .stat-number');
        const statActionsEl = document.querySelector('#stat-actions .stat-number');
        
        if (statProdsEl) statProdsEl.textContent = products.length;
        if (statDrugsEl) statDrugsEl.textContent = uniqueDrugs.size;
        if (statActionsEl) statActionsEl.textContent = uniqueActions.size;
        
        if (statsWidget) {
            statsWidget.style.display = 'block';
        }
    }

    // 4. Processing and Grouping Engine
    function processAndRender(products, isSearch = false) {
        // Group raw list hierarchy: Drug -> Presentation -> Brands
        const grouped = {};
        
        let totalProducts = 0;
        
        products.forEach(p => {
            const drugName = p.drug_name;
            
            // Standardize presentation using cleanForm helper
            const formClean = cleanForm(p.forma_farmaceutica);
            const pres = `${p.potencia || ''} ${p.unidad_potencia || ''} ${formClean} x ${p.unidades || ''}`.trim();
            // Fallback if empty or malformed
            const finalPres = (!pres || pres.startsWith('x') || pres.endsWith('x')) ? p.pres_orig : pres;
            
            totalProducts++;
            
            if (!grouped[drugName]) {
                grouped[drugName] = {
                    presentations: {},
                    actions: new Set()
                };
            }
            if (p.action_name) {
                grouped[drugName].actions.add(p.action_name);
            }
            if (!grouped[drugName].presentations[finalPres]) {
                grouped[drugName].presentations[finalPres] = [];
            }
            
            grouped[drugName].presentations[finalPres].push(p);
        });
        
        // If it's not a search filter query, update the global stats cards
        if (!isSearch) {
            updateStats(products);
        }
        
        // Update Search Badges
        resultsCountBadge.textContent = `${totalProducts} encontrados`;
        
        // Handle Empty Results
        if (totalProducts === 0) {
            loadingSpinner.style.display = 'none';
            viewerContent.style.display = 'none';
            noResultsView.style.display = 'flex';
            return;
        }
        
        noResultsView.style.display = 'none';
        
        // Render Accordions HTML
        renderAccordionList(grouped, isSearch);
    }

    // 5. Accordion HTML Renderer (Lazy Loading / On-Demand Rendering)
    function renderAccordionList(groupedData, isSearch = false) {
        viewerContent.innerHTML = '';
        
        // Sort Drugs alphabetically
        const sortedDrugs = Object.keys(groupedData).sort();
        
        sortedDrugs.forEach(drug => {
            const drugCard = document.createElement('article');
            drugCard.className = 'action-card';
            drugCard.dataset.loaded = 'false';
            
            const drugInfo = groupedData[drug];
            const presentations = drugInfo.presentations;
            const actionText = Array.from(drugInfo.actions).join(', ') || 'Sin Acción';
            
            const presCount = Object.keys(presentations).length;
            let productCount = 0;
            Object.values(presentations).forEach(prods => {
                productCount += prods.length;
            });
            
            // Store presentations data directly on the DOM node for lazy rendering
            drugCard._presentationsData = presentations;
            
            // Accordion Header Button (without drug items rendered inside)
            drugCard.innerHTML = `
                <button class="action-header" aria-expanded="false">
                    <div class="action-title-area" style="display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                            <span class="action-title-badge" style="background-color: var(--primary-color);">Droga</span>
                            <h3 class="action-title-text">${highlightText(drug, currentSearchQuery)}</h3>
                        </div>
                        <span class="treatment-label" style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">
                            Tratamiento: <strong style="color: var(--text-color);">${highlightText(actionText, currentSearchQuery)}</strong>
                        </span>
                    </div>
                    <div class="action-header-meta">
                        <span class="action-counts-badge">${presCount} pres. / ${productCount} prod.</span>
                        <span class="accordion-arrow">▼</span>
                    </div>
                </button>
                <div class="action-body">
                    <div class="presentations-list"></div>
                </div>
            `;
            
            // Add Accordion Expand/Collapse Event
            const headerBtn = drugCard.querySelector('.action-header');
            headerBtn.addEventListener('click', () => {
                const isActive = drugCard.classList.toggle('active');
                headerBtn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
                if (isActive && drugCard.dataset.loaded === 'false') {
                    renderDrugBody(drugCard);
                }
            });
            
            viewerContent.appendChild(drugCard);
        });
        
        // Auto-expand card(s)
        const allCards = viewerContent.querySelectorAll('.action-card');
        if (allCards.length > 0) {
            if (isSearch && allCards.length <= 10) {
                // Auto-expand all matching cards for search if they are 10 or fewer
                allCards.forEach(card => {
                    card.classList.add('active');
                    card.querySelector('.action-header').setAttribute('aria-expanded', 'true');
                    renderDrugBody(card);
                });
            } else {
                // Auto-expand only the first card
                const firstCard = allCards[0];
                firstCard.classList.add('active');
                firstCard.querySelector('.action-header').setAttribute('aria-expanded', 'true');
                renderDrugBody(firstCard);
            }
        }
        
        // Hide Spinner and Show View
        loadingSpinner.style.display = 'none';
        viewerContent.style.display = 'flex';
        toolbar.style.display = 'flex';
    }

    // Dynamic renderer for the inside content of a single Drug accordion
    function renderDrugBody(drugCard) {
        const presentations = drugCard._presentationsData;
        const presListContainer = drugCard.querySelector('.action-body .presentations-list');
        
        // Clear any previous child contents if somehow rendering twice
        presListContainer.innerHTML = '';
        
        // Sort Presentations
        const sortedPres = Object.keys(presentations).sort();
        
        sortedPres.forEach(pres => {
            const presBlock = document.createElement('div');
            presBlock.className = 'presentation-block';
            const productsList = [...presentations[pres]].sort((a, b) => a.price - b.price);
            
            // Calculate Price Dispersion (Brecha de Precios)
            let dispersionBadgeHtml = "";
            if (productsList.length > 1) {
                const minPrice = productsList[0].price;
                const maxPrice = productsList[productsList.length - 1].price;
                const dispersion = ((maxPrice - minPrice) / minPrice) * 100;
                
                if (dispersion > 50) {
                    dispersionBadgeHtml = `<span class="dispersion-badge dispersion-badge-high" title="Brecha de precio alta entre marcas comerciales.">🔴 Brecha: +${dispersion.toFixed(0)}%</span>`;
                } else if (dispersion > 15) {
                    dispersionBadgeHtml = `<span class="dispersion-badge dispersion-badge-med" title="Brecha de precio media entre marcas comerciales.">🟡 Brecha: +${dispersion.toFixed(0)}%</span>`;
                } else {
                    dispersionBadgeHtml = `<span class="dispersion-badge dispersion-badge-low" title="Brecha de precio baja. Precios homogéneos.">🟢 Brecha: +${dispersion.toFixed(0)}%</span>`;
                }
            } else {
                dispersionBadgeHtml = `<span class="dispersion-badge dispersion-badge-single" title="Solo hay una alternativa comercial para este medicamento.">⚪ Única alternativa</span>`;
            }
            
            presBlock.innerHTML = `
                <h5 class="presentation-title">Presentación: ${pres} ${dispersionBadgeHtml}</h5>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th class="col-brand">Nombre Comercial</th>
                                <th class="col-lab">Laboratorio</th>
                                <th class="col-price">Precio Sugerido</th>
                                <th class="col-diff">% Increm.</th>
                                <th class="col-date">Vigencia</th>
                                <th class="col-action" style="width: 12%; text-align: center;">Acción</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            `;
            
            const tbody = presBlock.querySelector('tbody');
            
            // Inside each presentation, products are already sorted by price (ASC) from DB
            const minPrice = productsList[0].price;
            
            productsList.forEach((prod, index) => {
                const tr = document.createElement('tr');
                
                const isCheapest = index === 0 && productsList.length > 1;
                if (isCheapest) {
                    tr.className = 'cheapest-row';
                }
                
                const pName = prod.brand_name;
                const lName = prod.lab_name;
                const pVal = formatCurrency(prod.price);
                const pDate = formatDate(prod.price_date);
                
                // Calculate percentage difference relative to the cheapest brand
                let diffBadge = '-';
                if (productsList.length > 1) {
                    if (index === 0) {
                        diffBadge = `<span class="badge-smart-buy" title="Esta es la opción de mejor precio para esta presentación.">🏆 Compra Inteligente</span>`;
                    } else {
                        const pctValue = ((prod.price - minPrice) / minPrice) * 100;
                        if (pctValue >= 50) {
                            diffBadge = `<span class="badge-brand-premium" title="Esta marca tiene un sobreprecio de ${pctValue.toFixed(0)}% frente al mínimo.">⚠️ Marca Premium (+${pctValue.toFixed(0)}%)</span>`;
                        } else {
                            const pct = formatPercentage(prod.price, minPrice);
                            diffBadge = `<span class="markup-badge">${pct}</span>`;
                        }
                    }
                }
                
                // Cart status
                const isInCart = prescriptionCart.some(item => item.nro_registro === prod.nro_registro);
                const actionBtn = isInCart 
                    ? `<span class="added-badge" data-reg="${prod.nro_registro}">✓ Añadido</span>`
                    : `<button class="add-to-prescription-btn" data-reg="${prod.nro_registro}">🛒 Añadir</button>`;
                
                // Prescription status mapping
                let saleConditionLabel = '';
                let saleConditionClass = '';
                switch (prod.tipo_venta) {
                    case '1':
                        saleConditionLabel = 'Venta Libre';
                        saleConditionClass = 'sale-libre';
                        break;
                    case '2':
                        saleConditionLabel = 'Bajo Receta';
                        saleConditionClass = 'sale-receta';
                        break;
                    case '3':
                    case '7':
                        saleConditionLabel = 'Receta Archivada';
                        saleConditionClass = 'sale-archivada';
                        break;
                    case '4':
                        saleConditionLabel = 'Controlado';
                        saleConditionClass = 'sale-controlado';
                        break;
                    case '5':
                        saleConditionLabel = 'Uso Hospitalario';
                        saleConditionClass = 'sale-hospitalario';
                        break;
                    default:
                        saleConditionLabel = '';
                }
                
                let saleBadgeHtml = saleConditionLabel 
                    ? `<span class="badge-sale ${saleConditionClass}">${saleConditionLabel}</span>` 
                    : '';
                    
                // Cold chain & Imported status
                let extraBadgesHtml = '';
                if (prod.heladera === 1) {
                    extraBadgesHtml += `<span class="badge-extra badge-cold" title="Requiere conservación en heladera (2°C a 8°C)">❄️ Cadena de Frío</span>`;
                }
                if (prod.importado === 1) {
                    extraBadgesHtml += `<span class="badge-extra badge-imported" title="Medicamento Importado">✈️ Importado</span>`;
                }

                const unitPrice = prod.price / prod.unidades;
                tr.innerHTML = `
                    <td class="col-brand">
                        <div class="product-brand-cell" style="display: flex; flex-direction: column; gap: 0.25rem; align-items: flex-start;">
                            <span class="brand-name-text clickable-brand" data-reg="${prod.nro_registro}" style="font-weight: 600; cursor: pointer; text-decoration: underline;">${highlightText(pName, currentSearchQuery)}</span>
                            <div class="badges-row" style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-top: 0.15rem;">
                                ${saleBadgeHtml}
                                ${extraBadgesHtml}
                            </div>
                        </div>
                    </td>
                    <td class="col-lab">${highlightText(lName, currentSearchQuery)}</td>
                    <td class="col-price">
                        ${pVal}
                        <span class="unit-price-subtext">(${formatCurrency(unitPrice)} / u)</span>
                    </td>
                    <td class="col-diff">${diffBadge}</td>
                    <td class="col-date">${pDate}</td>
                    <td class="col-action" style="text-align: center;">${actionBtn}</td>
                `;
                tbody.appendChild(tr);
            });
            
            presListContainer.appendChild(presBlock);
        });
        
        drugCard.dataset.loaded = "true";
    }

    // 6. Expand / Collapse All Event Listeners
    document.getElementById('btn-expand-all').addEventListener('click', () => {
        const cards = viewerContent.querySelectorAll('.action-card');
        cards.forEach(card => {
            card.classList.add('active');
            card.querySelector('.action-header').setAttribute('aria-expanded', 'true');
            if (card.dataset.loaded === 'false') {
                renderDrugBody(card);
            }
        });
    });

    document.getElementById('btn-collapse-all').addEventListener('click', () => {
        const cards = viewerContent.querySelectorAll('.action-card');
        cards.forEach(card => {
            card.classList.remove('active');
            card.querySelector('.action-header').setAttribute('aria-expanded', 'false');
        });
    });

    // 7. Prescription Simulator (Cart) & Auditor Engine
    
    // Coverage input listener
    if (coverageInput) {
        coverageInput.addEventListener('input', (e) => {
            let val = parseInt(e.target.value, 10);
            if (isNaN(val)) val = 0;
            if (val < 0) val = 0;
            if (val > 100) val = 100;
            
            coberturaPorcentaje = val;
            localStorage.setItem('alfabeta_coverage', coberturaPorcentaje);
            
            // Highlight active button if any
            shortcutButtons.forEach(btn => {
                if (parseInt(btn.dataset.value, 10) === coberturaPorcentaje) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            updatePrescriptionCartUI();
        });
    }
    
    // Coverage shortcuts listeners
    shortcutButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = parseInt(btn.dataset.value, 10);
            coberturaPorcentaje = val;
            localStorage.setItem('alfabeta_coverage', coberturaPorcentaje);
            
            if (coverageInput) {
                coverageInput.value = val;
            }
            
            shortcutButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            updatePrescriptionCartUI();
        });
    });
    
    // Add product event (uses event delegation on viewerContent)
    viewerContent.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-prescription-btn')) {
            const regNum = parseInt(e.target.dataset.reg, 10);
            addToPrescription(regNum, e.target);
        }
    });
    
    function addToPrescription(regNum, buttonEl) {
        // Find product in allProducts
        const product = allProducts.find(p => p.nro_registro === regNum);
        if (!product) return;
        
        // Avoid duplicates
        if (!prescriptionCart.some(item => item.nro_registro === regNum)) {
            prescriptionCart.push(product);
            localStorage.setItem('alfabeta_prescription', JSON.stringify(prescriptionCart));
        }
        
        // Update specific button immediately to avoided full render lag
        if (buttonEl) {
            const badge = document.createElement('span');
            badge.className = 'added-badge';
            badge.dataset.reg = regNum;
            badge.textContent = '✓ Añadido';
            buttonEl.parentNode.replaceChild(badge, buttonEl);
        }
        
        updatePrescriptionCartUI();
    }
    
    // Remove item event delegation inside prescription body
    
    prescriptionBody.addEventListener('click', (e) => {
        if (e.target.id === 'btn-whatsapp-share' || e.target.closest('#btn-whatsapp-share')) {
            shareToWhatsApp();
        }

        const discountBtn = e.target.closest('.btn-item-discount');
        if (discountBtn) {
            const regNum = parseInt(discountBtn.dataset.reg, 10);
            const val = parseInt(discountBtn.dataset.val, 10);
            
            const cartItem = prescriptionCart.find(item => item.nro_registro === regNum);
            if (cartItem) {
                cartItem.discount = val;
                localStorage.setItem('alfabeta_prescription', JSON.stringify(prescriptionCart));
                updatePrescriptionCartUI();
            }
            return;
        }

        if (e.target.classList.contains('remove-item-btn') || e.target.parentNode.classList.contains('remove-item-btn')) {
            const btn = e.target.classList.contains('remove-item-btn') ? e.target : e.target.parentNode;
            const regNum = parseInt(btn.dataset.reg, 10);
            removeFromPrescription(regNum);
        } else if (e.target.id === 'btn-clear-prescription') {
            clearPrescription();
        } else if (e.target.id === 'btn-optimize-cart') {
            optimizeCart();
        }
    });
    
    function removeFromPrescription(regNum) {
        prescriptionCart = prescriptionCart.filter(item => item.nro_registro !== regNum);
        localStorage.setItem('alfabeta_prescription', JSON.stringify(prescriptionCart));
        
        // Re-enable button in the table if it is currently visible in the DOM
        const badge = viewerContent.querySelector(`.added-badge[data-reg="${regNum}"]`);
        if (badge) {
            const btn = document.createElement('button');
            btn.className = 'add-to-prescription-btn';
            btn.dataset.reg = regNum;
            btn.textContent = '🛒 Añadir';
            badge.parentNode.replaceChild(btn, badge);
        }
        
        updatePrescriptionCartUI();
    }
    
    function clearPrescription() {
        prescriptionCart = [];
        localStorage.removeItem('alfabeta_prescription');
        
        // Re-enable all "Añadir" buttons in the visible tables
        const badges = viewerContent.querySelectorAll('.added-badge');
        badges.forEach(badge => {
            const regNum = badge.dataset.reg;
            const btn = document.createElement('button');
            btn.className = 'add-to-prescription-btn';
            btn.dataset.reg = regNum;
            btn.textContent = '🛒 Añadir';
            badge.parentNode.replaceChild(btn, badge);
        });
        
        updatePrescriptionCartUI();
    }
    
    function optimizeCart() {
        let optimizedCount = 0;
        
        prescriptionCart.forEach(item => {
            const cleanItemForm = cleanForm(item.forma_farmaceutica);
            // Find all equivalents of this product
            const equivalents = allProducts.filter(p => 
                p.drug_name === item.drug_name &&
                p.potencia === item.potencia &&
                p.unidad_potencia === item.unidad_potencia &&
                cleanForm(p.forma_farmaceutica) === cleanItemForm &&
                p.unidades === item.unidades
            );
            
            if (equivalents.length > 0) {
                // Find the cheapest one
                equivalents.sort((a, b) => a.price - b.price);
                const cheapest = equivalents[0];
                
                if (cheapest.nro_registro !== item.nro_registro) {
                    // Replace with the cheapest one but keep the current item's discount!
                    const originalDiscount = item.discount;
                    
                    // Create a copy of the cheapest object and assign the original discount
                    const optimizedItem = { ...cheapest, discount: originalDiscount };
                    
                    // Replace in the cart
                    const idx = prescriptionCart.findIndex(p => p.nro_registro === item.nro_registro);
                    if (idx !== -1) {
                        prescriptionCart[idx] = optimizedItem;
                        optimizedCount++;
                    }
                }
            }
        });
        
        if (optimizedCount > 0) {
            localStorage.setItem('alfabeta_prescription', JSON.stringify(prescriptionCart));
            updatePrescriptionCartUI();
            
            // Refresh list view to reflect updated cart buttons
            processAndRender(allProducts);
            
            showToast(`¡Se optimizaron ${optimizedCount} medicamentos al mejor precio! ⚡`);
        } else {
            showToast("Tu carrito ya se encuentra optimizado al mejor precio.");
        }
    }
    
    function updatePrescriptionCartUI() {
        // Toggle floating button
        if (prescriptionCart.length > 0) {
            prescriptionToggleBtn.style.display = 'flex';
            cartBadgeCount.textContent = prescriptionCart.length;
        } else {
            prescriptionToggleBtn.style.display = 'none';
            prescriptionPanel.classList.remove('open');
            prescriptionOverlay.classList.remove('open');
            return;
        }
        
        prescriptionBody.innerHTML = '';
        
        let totalElegidoPVP = 0;
        let totalElegidoClient = 0;
        let totalEconomicoClient = 0;
        
        prescriptionCart.forEach(item => {
            totalElegidoPVP += item.price;
            const discount = typeof item.discount === 'number' ? item.discount : 40;
            
            // Find equivalent products in memory (same drug, strength, unit, and units)
            const cleanItemForm = cleanForm(item.forma_farmaceutica);
            const equivalents = allProducts.filter(p => 
                p.drug_name === item.drug_name &&
                p.potencia === item.potencia &&
                p.unidad_potencia === item.unidad_potencia &&
                cleanForm(p.forma_farmaceutica) === cleanItemForm &&
                p.unidades === item.unidades
            );
            
            let cheapestEquiv = null;
            if (equivalents.length > 0) {
                // Find minimum price among equivalents
                cheapestEquiv = equivalents.reduce((min, p) => p.price < min.price ? p : min, equivalents[0]);
            } else {
                cheapestEquiv = item; // Fallback to itself if no equivalents found
            }
            
            const itemClientPrice = item.price * (1 - discount / 100);
            const cheapestClientPrice = cheapestEquiv.price * (1 - discount / 100);
            const diffClientPrice = itemClientPrice - cheapestClientPrice;
            
            totalElegidoClient += itemClientPrice;
            totalEconomicoClient += cheapestClientPrice;
            
            // Build savings suggestion box from the Client perspective
            let suggestionHtml = "";
            if (diffClientPrice > 0.1 && cheapestEquiv.nro_registro !== item.nro_registro) {
                const savingPct = (((item.price - cheapestEquiv.price) / item.price) * 100).toFixed(0);
                suggestionHtml = `
                    <div class="item-cheapest-suggestion">
                        <div class="suggestion-header">💡 Ahorro si eliges el genérico:</div>
                        <div class="suggestion-body">
                            <span>${cheapestEquiv.brand_name} (${cheapestEquiv.lab_name})</span>
                            <span class="suggestion-savings" style="color: #38a169;">Ahorras: ${formatCurrency(diffClientPrice)} (-${savingPct}%)</span>
                        </div>
                    </div>
                `;
            } else {
                suggestionHtml = `
                    <div class="item-cheapest-suggestion" style="background-color: #f0fff4; border-left-color: #38a169;">
                        <div class="suggestion-header" style="color: #22543d;">✅ Compra eficiente:</div>
                        <div class="suggestion-body" style="color: #276749;">
                            <span>Esta es la alternativa más económica del catálogo.</span>
                        </div>
                    </div>
                `;
            }
            
            const card = document.createElement('div');
            card.className = 'prescription-item-card';
            card.innerHTML = `
                <button class="remove-item-btn" data-reg="${item.nro_registro}" title="Eliminar medicamento">✕</button>
                <div class="item-brand-title">${item.brand_name}</div>
                <div class="item-details">
                    <strong>${item.drug_name}</strong><br/>
                    ${item.potencia} ${item.unidad_potencia} ${cleanItemForm} x ${item.unidades} uds. (${item.lab_name})
                </div>
                <div class="item-price-row">
                    <span>PVP Sugerido:</span>
                    <span style="color: var(--text-muted); font-weight: normal;">${formatCurrency(item.price)}</span>
                </div>
                
                <!-- Individual discount configuration row -->
                <div class="item-discount-row" style="margin-top: 0.5rem; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
                    <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Descuento O.S.:</span>
                    <div class="item-discount-selector" style="display: flex; gap: 0.25rem;">
                        <button class="btn-item-discount ${discount === 0 ? 'active' : ''}" data-reg="${item.nro_registro}" data-val="0">0%</button>
                        <button class="btn-item-discount ${discount === 40 ? 'active' : ''}" data-reg="${item.nro_registro}" data-val="40">40%</button>
                        <button class="btn-item-discount ${discount === 50 ? 'active' : ''}" data-reg="${item.nro_registro}" data-val="50">50%</button>
                        <button class="btn-item-discount ${discount === 70 ? 'active' : ''}" data-reg="${item.nro_registro}" data-val="70">70%</button>
                        <button class="btn-item-discount ${discount === 100 ? 'active' : ''}" data-reg="${item.nro_registro}" data-val="100">100%</button>
                    </div>
                </div>

                <div class="item-price-row" style="border-bottom: none; font-weight: 700; margin-top: 0.15rem;">
                    <span>A cargo Cliente:</span>
                    <span style="color: var(--primary-color);">${formatCurrency(itemClientPrice)}</span>
                </div>
                ${suggestionHtml}
            `;
            prescriptionBody.appendChild(card);
        });
        
        const savingsClient = totalElegidoClient - totalEconomicoClient;
        const totalSavingsPct = totalElegidoClient > 0 ? ((savingsClient / totalElegidoClient) * 100).toFixed(0) : 0;
        
        const summaryCard = document.createElement('div');
        summaryCard.className = 'prescription-summary-card';
        summaryCard.innerHTML = `
            <div class="summary-row">
                <span>Total de los Medicamentos (Valor PVP):</span>
                <span>${formatCurrency(totalElegidoPVP)}</span>
            </div>
            <div class="summary-row">
                <span>A pagar Cliente (Marca Elegida):</span>
                <span>${formatCurrency(totalElegidoClient)}</span>
            </div>
            <div class="summary-row">
                <span>A pagar Cliente (Marca Económica):</span>
                <span>${formatCurrency(totalEconomicoClient)}</span>
            </div>
            ${savingsClient > 0.1 ? `
                <div class="summary-row-bold summary-savings-row" style="background-color: #e6fffa; border-color: #b2f5ea; color: #319795; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.75rem;">
                    <span>🎉 ¡Podés ahorrar ${formatCurrency(savingsClient)} (-${totalSavingsPct}%) comprando las alternativas recomendadas!</span>
                </div>
            ` : `
                <div class="summary-row-bold summary-savings-row" style="color: #b7791f; border-color: #fbd38d; background-color: #fffaf0; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.75rem;">
                    <span>🏆 ¡Felicitaciones! Tenés las opciones más baratas del mercado.</span>
                </div>
            `}
            <div class="summary-row-bold">
                <span>Total a Pagar por Cliente:</span>
                <span>${formatCurrency(totalElegidoClient)}</span>
            </div>
            <div class="prescription-actions" style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%;">
                ${savingsClient > 0.1 ? `
                    <button id="btn-optimize-cart" class="btn-primary-action" style="background-color: #48bb78; border: none; font-weight: 700; width: 100%; display: flex; justify-content: center; align-items: center; gap: 0.25rem; color: white; border-radius: 6px; padding: 0.75rem; cursor: pointer;">⚡ Optimizar mi Ahorro</button>
                ` : ''}
                
                <button id="btn-whatsapp-share" class="btn-whatsapp-action" style="background-color: #25D366; border: none; font-weight: 700; width: 100%; display: flex; justify-content: center; align-items: center; gap: 0.5rem; color: white; border-radius: 6px; padding: 0.75rem; cursor: pointer; margin-top: 0.5rem;">
                    <span style="font-size: 1.1rem;">📱</span> Enviar a WhatsApp
                </button>
                <button id="btn-clear-prescription" class="btn-secondary-action" style="width: 100%; text-align: center;">Vaciar Carrito</button>
            </div>
        `;
        prescriptionBody.appendChild(summaryCard);
    }
    
    // Toggle prescription panel visibility
    prescriptionToggleBtn.addEventListener('click', () => {
        prescriptionPanel.classList.toggle('open');
        prescriptionOverlay.classList.toggle('open');
    });
    
    closePrescriptionBtn.addEventListener('click', () => {
        prescriptionPanel.classList.remove('open');
        prescriptionOverlay.classList.remove('open');
    });
    
    prescriptionOverlay.addEventListener('click', () => {
        prescriptionPanel.classList.remove('open');
        prescriptionOverlay.classList.remove('open');
    });

    
    function shareToWhatsApp() {
        let text = "🛒 *Mi Carrito de Farmacia* (TuRemedioIdeal)\n\n";
        let total = 0;
        prescriptionCart.forEach(item => {
            const discount = typeof item.discount === 'number' ? item.discount : 40;
            const price = item.price * (1 - discount / 100);
            total += price;
            text += `🔹 *${item.brand_name}* (${item.lab_name})\n`;
            text += `   ${item.drug_name} ${item.potencia}\n`;
            text += `   Precio c/ ${discount}% desc: $${price.toFixed(2)}\n\n`;
        });
        text += `💰 *Total a pagar aprox:* $${total.toFixed(2)}\n`;
        
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }

    // 9. Formatting Helpers
    function cleanForm(form) {
        if (!form) return "";
        const f = form.toLowerCase();
        if (f.includes("comprimidos/pastillas") || f.includes("comprimido")) return "comp.";
        if (f.includes("liberación controlada") || f.includes("liberacion controlada") || f.includes("prolongada")) return "comp. lib. prol.";
        if (f.includes("cápsulas/globulos") || f.includes("capsula")) return "cáps.";
        if (f.includes("líquidos/soluciones") || f.includes("jarabe") || f.includes("gotas") || f.includes("suspension")) return "sol.";
        if (f.includes("inyectables") || f.includes("inyectable") || f.includes("polvo iny")) return "iny.";
        return form;
    }

    function formatCurrency(price) {
        // Argentine format: $ 12.350,50
        const parts = price.toFixed(2).split('.');
        const main = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return `$ ${main},${parts[1]}`;
    }

    function formatDate(dStr) {
        if (dStr && dStr.length === 8) {
            return `${dStr.substring(6, 8)}/${dStr.substring(4, 6)}/${dStr.substring(0, 4)}`;
        }
        return dStr;
    }

    function formatPercentage(price, minPrice) {
        if (minPrice <= 0) return "-";
        const pct = ((price - minPrice) / minPrice) * 100;
        if (pct === 0) return "-";
        return `+${pct.toFixed(1).replace('.', ',')}%`;
    }

    // Text highlighter helper (wraps matches in <mark> tags)
    function highlightText(text, query) {
        if (!query) return text;
        // Escape special regex characters
        const escaped = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escaped})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // 10. Page Layout Transitions
    function showLoadingState() {
        placeholderView.style.display = 'none';
        viewerContent.style.display = 'none';
        noResultsView.style.display = 'none';
        toolbar.style.display = 'none';
        if (statsWidget) {
            statsWidget.style.display = 'none';
        }
        loadingSpinner.style.display = 'flex';
    }

    function showPlaceholderView(title, message) {
        loadingSpinner.style.display = 'none';
        viewerContent.style.display = 'none';
        noResultsView.style.display = 'none';
        toolbar.style.display = 'none';
        statsWidget.style.display = 'none';
        
        placeholderView.querySelector('h3').textContent = title;
        placeholderView.querySelector('p').textContent = message;
        placeholderView.style.display = 'flex';
    }

    // SNOMED Explorer Modal Logic
    const snomedModal = document.getElementById('snomed-modal');
    const snomedModalClose = document.getElementById('snomed-modal-close');
    const snomedConceptTerm = document.getElementById('snomed-concept-term');
    const snomedConceptId = document.getElementById('snomed-concept-id');
    const snomedParentTerm = document.getElementById('snomed-parent-term');
    const btnCopySnomedId = document.getElementById('btn-copy-snomed-id');
    const btnFilterSnomed = document.getElementById('btn-filter-snomed');
    const lnkSnomedBrowser = document.getElementById('lnk-snomed-browser');
    const snomedEquivalentsBody = document.getElementById('snomed-equivalents-body');

    // Close Modal actions
    if (snomedModalClose) {
        snomedModalClose.addEventListener('click', closeSnomedModal);
    }
    if (snomedModal) {
        snomedModal.addEventListener('click', (e) => {
            if (e.target === snomedModal) closeSnomedModal();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && snomedModal && snomedModal.style.display === 'flex') {
            closeSnomedModal();
        }
    });

    function closeSnomedModal() {
        if (snomedModal) {
            snomedModal.classList.remove('show');
            setTimeout(() => {
                snomedModal.style.display = 'none';
            }, 200);
        }
        if (snomedModalChartInstance) {
            snomedModalChartInstance.destroy();
            snomedModalChartInstance = null;
        }
        if (snomedModalChartContainer) {
            snomedModalChartContainer.style.display = 'none';
        }
    }

    function openMedicineDetail(regNum) {
        console.log('openMedicineDetail called for', regNum);
        try {
        // Find product in allProducts
        const product = allProducts.find(p => Number(p.nro_registro) === Number(regNum));
        if (!product) {
            alert("Producto no encontrado para el código de registro: " + regNum + " (Total catálogo: " + allProducts.length + ")");
            return;
        }

        // Set dynamic title and concept term
        document.getElementById('snomed-modal-title').innerHTML = `<span>💊</span> Ficha de Ahorro y Comparación`;
        if (snomedConceptTerm) {
            snomedConceptTerm.textContent = product.brand_name;
        }
        
        // Update concept type label
        const conceptTypeLabel = document.getElementById('snomed-concept-type-label');
        if (conceptTypeLabel) {
            conceptTypeLabel.textContent = "Información de Ahorro";
        }

        // Format Sale Condition
        const saleConditionMap = {
            "1": "Venta Libre",
            "2": "Bajo Receta",
            "3": "Receta Archivada",
            "4": "Receta Oficial",
            "5": "Venta Vigilada",
            "6": "Ctrl. Médico Recom.",
            "7": "No Clasificado"
        };
        const saleCond = saleConditionMap[product.tipo_venta] || "No Clasificado";

        // Controlled substances mapping
        const controlledMap = {
            "2": "Psicotrópico II",
            "3": "Psicotrópico III",
            "4": "Psicotrópico IV",
            "6": "Estupefaciente I",
            "7": "Estupefaciente II",
            "8": "Estupefaciente III",
            "9": "Succinilcolina",
            "A": "Venta Vigilada"
        };
        const controlledText = controlledMap[product.marca_controlado];

        // Origin & Cold Chain & Controlled Text combined
        const originText = product.importado === 1 ? "🌐 Importado" : "🇦🇷 Nacional";
        const coldChainText = product.heladera === 1 ? "❄️ Refrigerado (2°C a 8°C)" : "🌡️ Temperatura Ambiente";
        const controlledBadgeHtml = controlledText 
            ? `<span style="color: var(--danger-red); font-weight: bold; background-color: var(--danger-light); padding: 0.15rem 0.4rem; border-radius: 4px; border: 1px solid #feb2b2; font-size: 0.75rem;">⚠️ ${controlledText}</span>` 
            : "No controlado";

        // Build grid items
        const detailGrid = document.getElementById('medicine-detail-grid');
        if (detailGrid) {
            let gridHtml = `
                <div class="meta-item">
                    <span class="meta-label">Drogas / Principio Activo</span>
                    <span class="parent-term-text">${product.drug_name} ${product.potencia} ${product.unidad_potencia}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Presentación y Forma</span>
                    <span class="parent-term-text">${cleanForm(product.forma_farmaceutica)} x ${product.unidades} uds. (${product.pres_orig})</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Laboratorio</span>
                    <span class="parent-term-text">${product.lab_name}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Precio Sugerido (PVP)</span>
                    <span class="parent-term-text" style="color: var(--primary-light); font-size: 1.1rem; font-weight: bold;">
                        ${formatCurrency(product.price)}
                        <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal; display: inline-block; margin-left: 0.25rem;">(Vigencia: ${formatDate(product.price_date)})</span>
                    </span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Acción Terapéutica</span>
                    <span class="parent-term-text">${product.action_name}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Código de Troquel</span>
                    <div class="meta-value-row">
                        <span class="sctid-text" style="background-color: #f7fafc; border-color: var(--border-color); color: var(--text-main); font-size: 0.85rem; padding: 0.2rem 0.5rem;">${product.troquel || '-'}</span>
                        ${product.troquel ? `<button class="btn-copy-mini" id="btn-copy-troquel" title="Copiar Troquel">📋</button>` : ''}
                    </div>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Condición de Venta</span>
                    <span class="parent-term-text">${saleCond}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Regulación / Control</span>
                    <span class="parent-term-text">${controlledBadgeHtml}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Conservación</span>
                    <span class="parent-term-text">${coldChainText}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Origen</span>
                    <span class="parent-term-text">${originText}</span>
                </div>
            `;

            detailGrid.innerHTML = gridHtml;

            // Convenience analysis (cost per unit)
            const cleanProductForm = cleanForm(product.forma_farmaceutica);
            const sameDrugAndDose = allProducts.filter(p => 
                p.drug_name === product.drug_name && 
                p.potencia === product.potencia &&
                p.unidad_potencia === product.unidad_potencia &&
                cleanForm(p.forma_farmaceutica) === cleanProductForm
            );

            let bestProduct = product;
            let bestUnitPrice = product.price / product.unidades;
            const currentUnitPrice = product.price / product.unidades;

            sameDrugAndDose.forEach(p => {
                const uPrice = p.price / p.unidades;
                if (uPrice < bestUnitPrice) {
                    bestUnitPrice = uPrice;
                    bestProduct = p;
                }
            });

            const savingContainer = document.getElementById('medicine-saving-recommendation');
            if (savingContainer) {
                const priceDiff = currentUnitPrice - bestUnitPrice;
                const savingsPct = currentUnitPrice > 0 ? Math.round((priceDiff / currentUnitPrice) * 100) : 0;
                
                if (savingsPct >= 3) { // Show recommendation if savings are at least 3%
                    savingContainer.className = "medicine-saving-card saving-alert";
                    
                    const sameBrand = bestProduct.brand_name.toLowerCase() === product.brand_name.toLowerCase();
                    let recommendationText = "";
                    if (sameBrand) {
                        recommendationText = `La presentación de <strong>${bestProduct.unidades} unidades</strong> de la misma marca es más conveniente. Ahorro del <strong>${savingsPct}%</strong> por unidad (${formatCurrency(bestUnitPrice)} / unidad vs ${formatCurrency(currentUnitPrice)} / unidad).`;
                    } else {
                        recommendationText = `Conviene comprar <strong>${bestProduct.brand_name} (${bestProduct.lab_name}) x ${bestProduct.unidades} uds.</strong> Ahorro del <strong>${savingsPct}%</strong> por unidad (${formatCurrency(bestUnitPrice)} / unidad vs ${formatCurrency(currentUnitPrice)} / unidad).`;
                    }
                    
                    savingContainer.innerHTML = `
                        <span class="saving-icon">💡</span>
                        <div class="saving-content">
                            <div class="saving-title">Opción de Compra Más Conveniente</div>
                            <div>${recommendationText}</div>
                            <button class="saving-action-btn" id="btn-view-saving-alt">Ver esta alternativa</button>
                        </div>
                    `;
                    savingContainer.style.display = "flex";
                    
                    // Bind click event to see the alternative
                    const btnViewSavingAlt = document.getElementById('btn-view-saving-alt');
                    if (btnViewSavingAlt) {
                        btnViewSavingAlt.onclick = () => {
                            openMedicineDetail(bestProduct.nro_registro);
                        };
                    }
                } else {
                    // Current product is the most efficient (or within 3% of it)
                    savingContainer.className = "medicine-saving-card saving-optimal";
                    savingContainer.innerHTML = `
                        <span class="saving-icon">🏆</span>
                        <div class="saving-content">
                            <div class="saving-title">Compra Eficiente</div>
                            <div>Este empaque ofrece el menor costo por unidad para esta droga y dosis (${formatCurrency(currentUnitPrice)} / unidad).</div>
                        </div>
                    `;
                    savingContainer.style.display = "flex";
                }
            }

            // Bind Troquel copy button
            const btnCopyTroquel = document.getElementById('btn-copy-troquel');
            if (btnCopyTroquel && product.troquel) {
                btnCopyTroquel.onclick = () => {
                    navigator.clipboard.writeText(product.troquel).then(() => {
                        showToast(`Código de troquel copiado: ${product.troquel}`);
                    });
                };
            }

            // Bind SNOMED copy button
            const btnCopySnomedIdDynamic = document.getElementById('btn-copy-snomed-id-dynamic');
            if (btnCopySnomedIdDynamic && product.snomed_id) {
                btnCopySnomedIdDynamic.onclick = () => {
                    navigator.clipboard.writeText(product.snomed_id).then(() => {
                        showToast(`SCTID copiado al portapapeles: ${product.snomed_id}`);
                    });
                };
            }
        }

        // SNOMED Browser link
        if (lnkSnomedBrowser) {
            if (product.snomed_id) {
                lnkSnomedBrowser.style.display = 'inline-flex';
                lnkSnomedBrowser.href = `https://browser.ihtsdotools.org/?perspective=full&conceptId=${product.snomed_id}`;
            } else {
                lnkSnomedBrowser.style.display = 'none';
            }
        }

        // Filter button click handler (triggers a database search)
        if (btnFilterSnomed) {
            btnFilterSnomed.onclick = () => {
                const filterValue = product.drug_name || product.snomed_term;
                triggerSearch(filterValue);
                const resultsPanel = document.querySelector('.results-panel');
                if (resultsPanel) resultsPanel.scrollIntoView({ behavior: 'smooth' });
            };
            
            if (product.snomed_id) {
                btnFilterSnomed.innerHTML = `<span>🔍</span> Filtrar por SNOMED`;
            } else {
                btnFilterSnomed.innerHTML = `<span>🔍</span> Filtrar por Droga`;
            }
        }

        // Fetch equivalents
        const cleanProductForm = cleanForm(product.forma_farmaceutica);
        const equivalents = allProducts.filter(p => {
            return p.drug_name === product.drug_name &&
                   p.potencia === product.potencia &&
                   p.unidad_potencia === product.unidad_potencia &&
                   cleanForm(p.forma_farmaceutica) === cleanProductForm &&
                   p.unidades === product.unidades;
        });

        // Sort equivalents by price ASC
        equivalents.sort((a, b) => a.price - b.price);

        // ----------------- Price Thermometer Rendering -----------------
        const priceThermometerContainer = document.getElementById('price-thermometer-container');
        if (priceThermometerContainer) {
            const minPrice = equivalents[0]?.price || product.price;
            const maxPrice = equivalents[equivalents.length - 1]?.price || product.price;
            const currentPrice = product.price;
            
            const range = maxPrice - minPrice;
            const pctPosition = range > 0 ? ((currentPrice - minPrice) / range) * 100 : 50;
            
            priceThermometerContainer.innerHTML = `
                <div class="price-thermometer-card">
                    <div class="thermometer-title">📈 Comparativa de Precios del Mercado</div>
                    <div class="thermometer-track-wrapper">
                        <div class="thermometer-line"></div>
                        <div class="thermometer-fill" style="width: ${pctPosition}%;"></div>
                        <div class="thermometer-marker" style="left: ${pctPosition}%;" title="Tu opción: ${formatCurrency(currentPrice)}">
                            <span class="marker-bubble">Tu Opción: ${formatCurrency(currentPrice)}</span>
                        </div>
                    </div>
                    <div class="thermometer-labels">
                        <span class="label-min">Genérico más Barato<br/><strong>${formatCurrency(minPrice)}</strong></span>
                        <span class="label-max">Marca más Cara<br/><strong>${formatCurrency(maxPrice)}</strong></span>
                    </div>
                </div>
            `;
        }
        // ---------------------------------------------------------------

        // Reset modal chart instance
        if (snomedModalChartInstance) {
            snomedModalChartInstance.destroy();
            snomedModalChartInstance = null;
        }

        // Automatically load and render price trend chart
        if (snomedModalChartContainer) {
            snomedModalChartContainer.style.display = 'block';
            
            const cheapestProduct = equivalents[0];
            const currentProduct = product;
            
            if (cheapestProduct) {
                const isSingle = cheapestProduct.nro_registro === currentProduct.nro_registro;
                
                (async () => {
                    try {
                        const fetchHistory = async (nro_reg) => {
                            const r = await fetch(`/api/products/price-history/${nro_reg}`);
                            return r.json();
                        };
                        
                        const [historyCurrent, historyCheapest] = await Promise.all([
                            fetchHistory(currentProduct.nro_registro),
                            isSingle ? [] : fetchHistory(cheapestProduct.nro_registro)
                        ]);
                        
                        const datesOrdered = [
                            '20250630', '20250731', '20250829', '20250930', '20251031', '20251128',
                            '20251230', '20260130', '20260227', '20260331', '20260430', '20260529'
                        ];
                        
                        const labels = datesOrdered.map(formatVersionDate);
                        
                        const mapCurrent = new Map(historyCurrent.map(d => [d.fecha, d.precio]));
                        const mapCheapest = new Map(historyCheapest.map(d => [d.fecha, d.precio]));
                        
                        const currentPrices = datesOrdered.map(d => mapCurrent.get(d) || null);
                        const cheapestPrices = datesOrdered.map(d => mapCheapest.get(d) || null);
                        
                        const datasets = [{
                            label: `Marca actual: ${currentProduct.brand_name} (${currentProduct.lab_name})`,
                            data: currentPrices,
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.08)',
                            borderWidth: 2.5,
                            tension: 0.3,
                            pointBackgroundColor: '#ef4444',
                            fill: true
                        }];
                        
                        if (!isSingle) {
                            datasets.push({
                                label: `Genérico (Más Económico): ${cheapestProduct.brand_name} (${cheapestProduct.lab_name})`,
                                data: cheapestPrices,
                                borderColor: '#10b981',
                                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                                borderWidth: 2.5,
                                tension: 0.3,
                                pointBackgroundColor: '#10b981',
                                fill: true
                            });
                        }
                        
                        const modalCtx = document.getElementById('snomedModalChart');
                        if (snomedModalChartInstance) {
                            snomedModalChartInstance.destroy();
                        }
                        
                        snomedModalChartInstance = new Chart(modalCtx, {
                            type: 'line',
                            data: {
                                labels: labels,
                                datasets: datasets
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                        labels: {
                                            color: '#2d3748',
                                            font: { family: 'Inter', size: 10, weight: 600 }
                                        }
                                    },
                                    tooltip: {
                                        mode: 'index',
                                        intersect: false,
                                        callbacks: {
                                            label: function(context) {
                                                let label = context.dataset.label || '';
                                                if (label) {
                                                    label = label.split(':')[0] + ': ';
                                                }
                                                if (context.parsed.y !== null) {
                                                    label += formatCurrency(context.parsed.y);
                                                }
                                                return label;
                                            }
                                        }
                                    }
                                },
                                scales: {
                                    x: {
                                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                                        ticks: { color: '#718096', font: { family: 'Inter', size: 10 } }
                                    },
                                    y: {
                                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                                        ticks: {
                                            color: '#718096',
                                            font: { family: 'Inter', size: 10 },
                                            callback: function(value) {
                                                return formatCurrency(value);
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    } catch (e) {
                        console.error("Error drawing modal chart:", e);
                    }
                })();
            }
        }

        // Render Equivalents inside the modal
        if (snomedEquivalentsBody) {
            snomedEquivalentsBody.innerHTML = '';
            
            const minPrice = equivalents[0]?.price || 0;
            
            equivalents.forEach(equiv => {
                const tr = document.createElement('tr');
                if (equiv.nro_registro === product.nro_registro) {
                    tr.style.backgroundColor = 'rgba(43, 108, 176, 0.06)';
                }
                
                let diffHtml = "-";
                if (equivalents.length > 1) {
                    if (equiv.price === minPrice) {
                        diffHtml = `<span class="cheapest-badge" style="font-size: 0.75rem; padding: 0.15rem 0.35rem; background-color: var(--success-light); color: var(--success-green); border-radius: 4px; font-weight: bold; border: 1px solid #b2f5ea;">MÍNIMO</span>`;
                    } else {
                        const pct = formatPercentage(equiv.price, minPrice);
                        diffHtml = `<span class="markup-badge" style="font-size: 0.75rem; padding: 0.15rem 0.35rem; background-color: var(--danger-light); color: var(--danger-red); border-radius: 4px; font-weight: bold; border: 1px solid #feb2b2;">${pct}</span>`;
                    }
                }

                // Action Button inside modal
                const isInPrescription = prescriptionCart.some(item => item.nro_registro === equiv.nro_registro);
                let modalActionBtn = "";
                if (isInPrescription) {
                    modalActionBtn = `<span class="added-badge" style="font-size: 0.8rem; padding: 0.2rem 0.4rem; background-color: #e6fffa; color: #319795; border-radius: 4px; border: 1px solid #b2f5ea; font-weight: bold;">✓ Añadido</span>`;
                } else {
                    modalActionBtn = `<button class="add-to-prescription-btn modal-add-btn" data-reg="${equiv.nro_registro}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--bg-card); cursor: pointer; transition: background-color var(--transition-fast);">🛒 Añadir</button>`;
                }
                
                const equivUnitPrice = equiv.price / equiv.unidades;
                tr.innerHTML = `
                    <td><strong class="clickable-brand" data-reg="${equiv.nro_registro}" style="cursor: pointer; text-decoration: underline; color: var(--primary-light);">${equiv.brand_name}</strong></td>
                    <td>${equiv.lab_name}</td>
                    <td style="text-align: right; font-weight: bold;">
                        ${formatCurrency(equiv.price)}
                        <span class="unit-price-subtext">(${formatCurrency(equivUnitPrice)} / u)</span>
                    </td>
                    <td style="text-align: right;">${diffHtml}</td>
                    <td style="text-align: center; vertical-align: middle;">${modalActionBtn}</td>
                `;
                
                // Add event listener to the "Añadir" button inside the modal row
                const addBtn = tr.querySelector('.modal-add-btn');
                if (addBtn) {
                    addBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        addToPrescription(equiv.nro_registro, null);
                        
                        // Replace button with badge in the modal instantly
                        const badge = document.createElement('span');
                        badge.className = 'added-badge';
                        badge.style.fontSize = '0.8rem';
                        badge.style.padding = '0.2rem 0.4rem';
                        badge.style.backgroundColor = '#e6fffa';
                        badge.style.color = '#319795';
                        badge.style.borderRadius = '4px';
                        badge.style.border = '1px solid #b2f5ea';
                        badge.style.fontWeight = 'bold';
                        badge.textContent = '✓ Añadido';
                        addBtn.parentNode.replaceChild(badge, addBtn);
                        
                        // Also sync button in the background main table if it is currently visible
                        const mainTableBtn = viewerContent.querySelector(`.add-to-prescription-btn[data-reg="${equiv.nro_registro}"]`);
                        if (mainTableBtn) {
                            const mainBadge = document.createElement('span');
                            mainBadge.className = 'added-badge';
                            mainBadge.dataset.reg = equiv.nro_registro;
                            mainBadge.textContent = '✓ Añadido';
                            mainTableBtn.parentNode.replaceChild(mainBadge, mainTableBtn);
                        }
                    });
                }
                
                snomedEquivalentsBody.appendChild(tr);
            });
        }

        // Render Therapeutic Class Alternatives (Other drugs under same action)
        const actionName = product.action_name;
        const snomedActionName = document.getElementById('snomed-action-name');
        const snomedClassGrid = document.getElementById('snomed-class-grid');
        
        if (snomedActionName) {
            snomedActionName.textContent = actionName;
        }
        
        if (snomedClassGrid) {
            snomedClassGrid.innerHTML = '';
            
            // Filter allProducts for same action but different drug molecule
            const classAltProducts = allProducts.filter(p => p.action_name === actionName && p.drug_name.toLowerCase() !== product.drug_name.toLowerCase());
            
            // Group by drug_name
            const drugGroups = {};
            classAltProducts.forEach(p => {
                if (!drugGroups[p.drug_name]) {
                    drugGroups[p.drug_name] = [];
                }
                drugGroups[p.drug_name].push(p);
            });
            
            const uniqueAltDrugs = Object.keys(drugGroups).sort();
            
            if (uniqueAltDrugs.length === 0) {
                snomedClassGrid.innerHTML = `<p style="grid-column: 1 / -1; font-size: 0.82rem; color: var(--text-muted); text-align: center; padding: 1.5rem; background-color: #f8fafc; border-radius: 8px; border: 1px dashed var(--border-color);">No hay otras drogas alternativas registradas para esta acción terapéutica.</p>`;
            } else {
                uniqueAltDrugs.forEach(altDrug => {
                    const prods = drugGroups[altDrug];
                    const brandCount = prods.length;
                    
                    // Find min and max price
                    let minPrice = Infinity;
                    let maxPrice = -Infinity;
                    prods.forEach(p => {
                        if (p.price < minPrice) minPrice = p.price;
                        if (p.price > maxPrice) maxPrice = p.price;
                    });
                    
                    const card = document.createElement('div');
                    card.className = 'class-alt-card';
                    
                    let priceText = "";
                    if (minPrice === maxPrice) {
                        priceText = `${formatCurrency(minPrice)}`;
                    } else {
                        priceText = `Desde ${formatCurrency(minPrice)} hasta ${formatCurrency(maxPrice)}`;
                    }
                    
                    card.innerHTML = `
                        <div>
                            <div class="class-alt-name">${altDrug}</div>
                            <div class="class-alt-meta">${brandCount} presentaciones</div>
                            <div class="class-alt-price-range">${priceText}</div>
                        </div>
                        <button class="btn-view-class-alt" data-drug="${altDrug}">👁️ Ver en catálogo</button>
                    `;
                    
                    // Bind click action to search and scroll to this drug
                    const viewBtn = card.querySelector('.btn-view-class-alt');
                    viewBtn.onclick = () => {
                        triggerSearch(altDrug);
                    };
                    
                    snomedClassGrid.appendChild(card);
                });
            }
        }

        // Show Modal with flex
        if (snomedModal) {
            snomedModal.style.display = 'flex';
            setTimeout(() => {
                snomedModal.classList.add('show');
            }, 10);
        }
        } catch (err) {
            console.error("Error in openMedicineDetail:", err);
            alert("Error al abrir detalle: " + err.message + "\nStack: " + err.stack);
        }
    }

    // Handle clicks on brand names in the catalog table
    viewerContent.addEventListener('click', (e) => {
        const brandTarget = e.target.closest('.clickable-brand');
        if (brandTarget) {
            const regNum = parseInt(brandTarget.dataset.reg, 10);
            try {
                openMedicineDetail(regNum);
            } catch(err) { alert('Error in openMedicineDetail: ' + err.message); }
            return;
        }

    

        const target = e.target;
        if (target.classList.contains('clickable-badge')) {
            // Check if it is a SNOMED badge (has data-snomed) or Troquel badge (has data-copy)
            if (target.dataset.snomed) {
                const snomedId = target.dataset.snomed;
                const regNum = parseInt(target.dataset.reg, 10);
                openMedicineDetail(regNum);
            } else {
                // Troquel badge: Copy to clipboard and filter catalogue
                const copyVal = target.dataset.copy;
                if (copyVal) {
                    navigator.clipboard.writeText(copyVal).then(() => {
                        showToast(`Código copiado al portapapeles: ${copyVal}`);
                    }).catch(err => {
                        console.error("Error al copiar al portapapeles:", err);
                    });
                    
                    triggerSearch(copyVal);
                    
                    const resultsPanel = document.querySelector('.results-panel');
                    if (resultsPanel) resultsPanel.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    });

    // Handle clicks on brand names in the equivalents table in the modal
    if (snomedEquivalentsBody) {
        snomedEquivalentsBody.addEventListener('click', (e) => {
            const brandTarget = e.target.closest('.clickable-brand');
            if (brandTarget) {
                const regNum = parseInt(brandTarget.dataset.reg, 10);
                openMedicineDetail(regNum);
            }
        });
    }

    // Toast notification helper
    function showToast(message) {
        let toast = document.getElementById('app-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'app-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.className = 'app-toast show';
        
        setTimeout(() => {
            toast.className = 'app-toast';
        }, 2500);
    }

    // ========================================================
    // TAB NAVIGATION LOGIC (Alfabeta vs SNOMED Consultor)
    // ========================================================
    const tabAlfabeta = document.getElementById('tab-alfabeta');
    const tabSnomed = document.getElementById('tab-snomed');
    const viewAlfabeta = document.getElementById('view-alfabeta-container');
    const viewSnomed = document.getElementById('view-snomed-container');

    if (tabAlfabeta && tabSnomed && viewAlfabeta && viewSnomed) {
        tabAlfabeta.addEventListener('click', () => {
            switchView('alfabeta');
        });
        
        tabSnomed.addEventListener('click', () => {
            switchView('snomed');
        });
    }

    function switchView(viewName) {
        if (viewName === 'alfabeta') {
            tabAlfabeta.classList.add('active');
            tabAlfabeta.setAttribute('aria-selected', 'true');
            tabSnomed.classList.remove('active');
            tabSnomed.setAttribute('aria-selected', 'false');
            viewAlfabeta.style.display = 'grid';
            viewSnomed.style.display = 'none';
        } else {
            tabSnomed.classList.add('active');
            tabSnomed.setAttribute('aria-selected', 'true');
            tabAlfabeta.classList.remove('active');
            tabAlfabeta.setAttribute('aria-selected', 'false');
            viewSnomed.style.display = 'grid';
            viewAlfabeta.style.display = 'none';
            // Trigger initial render of SNOMED diagnoses if not loaded
            initSnomedConsultor();
        }
    }

    // ========================================================
    // SNOMED CLINICAL CONSULTOR LOGIC (Methodology C)
    // ========================================================
    
    // SNOMED CT Clinical Refset of Therapeutic Indications


    // --- SNOMED CT V2 TREE LOGIC ---
    let snomedTreeLoaded = false;
    
    function initSnomedConsultor() {
        if (snomedTreeLoaded) return;
        
        const listContainer = document.getElementById('snomed-diagnoses-list');
        const searchInput = document.getElementById('snomed-diag-search');
        
        if (!listContainer) return;
        
        listContainer.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted);">Cargando jerarquía SNOMED CT...</div>';
        
        // Root node for Disease (Trastorno)
        const rootConceptId = "64572001";
        
        renderTreeLevel(rootConceptId, listContainer, true);
        snomedTreeLoaded = true;
        
        // Setup Search
        if (searchInput) {
            let timeout = null;
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    if (query.length >= 3) {
                        searchSnomed(query, listContainer);
                    } else if (query.length === 0) {
                        listContainer.innerHTML = '';
                        renderTreeLevel(rootConceptId, listContainer, true);
                    }
                }, 400);
            });
        }
    }
    
    async function searchSnomed(query, container) {
        container.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted);">Buscando...</div>';
        try {
            const res = await fetch(`/api/snomed/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            
            container.innerHTML = '';
            if (data.length === 0) {
                container.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted);">Sin resultados.</div>';
                return;
            }
            
            data.forEach(item => {
                const btn = document.createElement('button');
                btn.className = 'diagnosis-item';
                btn.innerHTML = `
                    <span class="diagnosis-name">${item.term}</span>
                    <span class="diagnosis-sctid">SCTID: ${item.id}</span>
                `;
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.diagnosis-item').forEach(el => el.classList.remove('active'));
                    btn.classList.add('active');
                    fetchAndShowDiagnosisDetails(item.id, item.term);
                });
                container.appendChild(btn);
            });
        } catch (e) {
            console.error(e);
            container.innerHTML = '<div style="padding: 1rem; text-align: center; color: red;">Error en búsqueda.</div>';
        }
    }
    
    async function renderTreeLevel(parentId, container, isRoot = false) {
        if (!isRoot) {
            container.innerHTML = '<div style="padding: 0.5rem; color: var(--text-muted); font-size: 0.8rem;">Cargando...</div>';
        }
        
        try {
            const res = await fetch(`/api/snomed/children/${parentId}`);
            const data = await res.json();
            
            container.innerHTML = '';
            
            if (data.length === 0 && !isRoot) {
                container.innerHTML = '<div style="padding: 0.5rem; color: var(--text-muted); font-size: 0.8rem;">Sin sub-conceptos.</div>';
                return;
            }
            
            data.forEach(item => {
                const nodeDiv = document.createElement('div');
                nodeDiv.style.marginLeft = isRoot ? '0' : '1rem';
                nodeDiv.style.borderLeft = isRoot ? 'none' : '1px dashed #cbd5e1';
                nodeDiv.style.paddingLeft = isRoot ? '0' : '0.5rem';
                nodeDiv.style.marginBottom = '0.2rem';
                
                const headerDiv = document.createElement('div');
                headerDiv.style.display = 'flex';
                headerDiv.style.alignItems = 'center';
                headerDiv.style.gap = '0.5rem';
                
                const expandBtn = document.createElement('button');
                expandBtn.innerHTML = '▶';
                expandBtn.style.background = 'none';
                expandBtn.style.border = 'none';
                expandBtn.style.cursor = 'pointer';
                expandBtn.style.fontSize = '0.7rem';
                expandBtn.style.color = 'var(--text-muted)';
                expandBtn.style.padding = '0.2rem';
                
                const titleBtn = document.createElement('button');
                titleBtn.className = 'diagnosis-item';
                titleBtn.style.flex = '1';
                titleBtn.style.marginBottom = '0';
                titleBtn.innerHTML = `
                    <span class="diagnosis-name" style="font-size: 0.85rem;">${item.term}</span>
                    <span class="diagnosis-sctid" style="font-size: 0.65rem;">SCTID: ${item.id}</span>
                `;
                
                headerDiv.appendChild(expandBtn);
                headerDiv.appendChild(titleBtn);
                nodeDiv.appendChild(headerDiv);
                
                const childrenContainer = document.createElement('div');
                childrenContainer.style.display = 'none';
                nodeDiv.appendChild(childrenContainer);
                
                let expanded = false;
                let loaded = false;
                
                expandBtn.addEventListener('click', () => {
                    expanded = !expanded;
                    expandBtn.innerHTML = expanded ? '▼' : '▶';
                    childrenContainer.style.display = expanded ? 'block' : 'none';
                    if (expanded && !loaded) {
                        loaded = true;
                        renderTreeLevel(item.id, childrenContainer);
                    }
                });
                
                titleBtn.addEventListener('click', () => {
                    document.querySelectorAll('.diagnosis-item').forEach(el => el.classList.remove('active'));
                    titleBtn.classList.add('active');
                    fetchAndShowDiagnosisDetails(item.id, item.term);
                });
                
                container.appendChild(nodeDiv);
            });
            
        } catch (e) {
            console.error(e);
            container.innerHTML = '<div style="padding: 0.5rem; color: red;">Error.</div>';
        }
    }
    
    async function fetchAndShowDiagnosisDetails(sctid, term) {
        const treatmentsContainer = document.getElementById('snomed-suggested-treatments-container');
        if (treatmentsContainer) {
            treatmentsContainer.innerHTML = '<div style="padding: 2rem; text-align: center;">Consultando motor SNOMED... ⏳</div>';
        }
        
        try {
            const res = await fetch(`/api/snomed/details/${sctid}`);
            const data = await res.json();
            currentSnomedDiag = data; // store globally for methodology toggles
            showDiagnosisDetails(data);
        } catch (e) {
            console.error(e);
            if (treatmentsContainer) {
                treatmentsContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: red;">Error al consultar el detalle ontológico.</div>';
            }
        }
    }

    // Function to check if user has allergies crossing with ATC
    function checkAllergyAlert(atcCode) {
        const allergyToggle = document.getElementById('patient-allergy-toggle');
        if (allergyToggle && allergyToggle.checked && atcCode) {
            // Mock: If patient is allergic to penicillins (J01C) or similar mock, we trigger red alert.
            // Let's say patient is allergic to J01 (Antibacterials) and C09 (Agents acting on renin-angiotensin)
            if (atcCode.startsWith('J01') || atcCode.startsWith('C09')) {
                return true;
            }
        }
        return false;
    }

    function createFindButton(patId, searchQuery, atcCode = null) {
        const btn = document.createElement('button');
        btn.className = 'btn-class-find';
        btn.dataset.patology = patId;
        btn.dataset.query = searchQuery;
        btn.dataset.atc = atcCode || '';
        
        const cleanAtc = (atcCode && atcCode !== 'S/D' && atcCode.trim() !== '') ? atcCode.trim() : null;
        
        const hasAllergy = cleanAtc ? checkAllergyAlert(cleanAtc) : false;
        if (hasAllergy) {
            btn.innerHTML = '⚠️ CONTRAINDICACIÓN SEVERA';
            btn.style.backgroundColor = '#e53e3e';
            btn.style.color = 'white';
        } else {
            btn.innerHTML = '🔎 Buscar en catálogo';
        }
        
        btn.addEventListener('click', async () => {
            if (hasAllergy) {
                alert("ALERTA DE SEGURIDAD CLÍNICA:\nEl paciente registra una alergia cruzada ontológicamente con esta familia ATC (" + cleanAtc + "). Prescripción bloqueada.");
                return;
            }
            
            switchView('alfabeta');
            
            if (cleanAtc) {
                // ATC Mode: fetch products by ATC code exactly
                if (catalogSearchInput) {
                    catalogSearchInput.value = 'ATC: ' + cleanAtc + ' (' + searchQuery + ')';
                    currentSearchQuery = searchQuery;
                    if (clearSearchBtn) clearSearchBtn.style.display = 'block';
                }
                
                loadingSpinner.style.display = 'block';
                placeholderView.style.display = 'none';
                noResultsView.style.display = 'none';
                viewerContent.style.display = 'none';
                viewerContent.innerHTML = '';
                
                try {
                    const res = await fetch(`/api/products/by-atc/${cleanAtc}`);
                    const data = await res.json();
                    
                    loadingSpinner.style.display = 'none';
                    if (data.length === 0) {
                        noResultsView.style.display = 'flex';
                    } else {
                        viewerContent.style.display = 'grid';
                        allProducts = data; // hijack allProducts
                        processAndRender(data, true);
                    }
                } catch (e) {
                    console.error(e);
                    loadingSpinner.style.display = 'none';
                }
                
                setTimeout(() => {
                    const resultsPanel = document.querySelector('.results-panel');
                    if (resultsPanel) {
                        resultsPanel.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 50);
                
            } else {
                // Text Mode - Use new catalog search input
                if (catalogSearchInput) {
                    catalogSearchInput.value = searchQuery;
                    performCatalogSearch();
                }
            }
        });
        
        return btn;
    }
    function showDiagnosisDetails(diag) {
        const diagNameEl = document.getElementById('consultor-diag-name');
        const diagSctidEl = document.getElementById('consultor-diag-sctid');
        const diagDescEl = document.getElementById('consultor-diag-desc');
        const treatmentsContainer = document.getElementById('snomed-suggested-treatments-container');
        
        if (!diagNameEl || !diagSctidEl || !diagDescEl || !treatmentsContainer) return;
        
        diagNameEl.textContent = diag.name;
        diagSctidEl.textContent = `SCTID: ${diag.sctid}`;
        diagDescEl.textContent = diag.desc;
        
        // Show subtabs container
        if (subtabsContainer) {
            subtabsContainer.style.display = 'flex';
        }
        
        // Check active sub-tab preference and show/render
        if (activeSnomedSubtab === 'clinical-support') {
            renderClinicalSupport(diag);
        } else if (activeSnomedSubtab === 'price-history') {
            renderPriceHistoryView(diag);
        }
        
        treatmentsContainer.innerHTML = '';

        if (activeMethodology === 'A') {
            if (!diag.methodologyA) {
                treatmentsContainer.innerHTML = '<p>Datos ontológicos no disponibles para este diagnóstico.</p>';
                return;
            }
            
            const card = document.createElement('div');
            card.className = 'snomed-flow-chart';
            
            let html = `
                <h4 style="margin-bottom: 1rem; color: var(--primary-color);">Flujo Ontológico de Relaciones</h4>
                
                <div class="flow-node">
                    <span class="flow-node-title">Diagnóstico Clínico</span>
                    <span class="flow-node-name">${diag.name}</span>
                    <span class="flow-node-sctid">${diag.sctid}</span>
                </div>
                
                <div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 0.2rem;">
                    ⬇️ <em>has focus (tiene foco)</em>
                </div>
                
                <div class="flow-node" style="border-color: #4299e1;">
                    <span class="flow-node-title">Procedimiento / Terapia</span>
                    <span class="flow-node-name">${diag.methodologyA.procedureName}</span>
                    <span class="flow-node-sctid">${diag.methodologyA.procedureSctid}</span>
                    
                    <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted); border-top: 1px dashed #e2e8f0; padding-top: 0.5rem;">
                        <strong>Is a (Es un):</strong> ${diag.methodologyA.parentName} <span style="font-family: monospace;">(${diag.methodologyA.parentSctid})</span>
                    </div>
                </div>
                
                <div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 0.2rem;">
                    ⬇️ <em>using substance (utiliza sustancia)</em>
                </div>
            `;
            
            card.innerHTML = html;
            
            diag.methodologyA.substances.forEach(sub => {
                const subNode = document.createElement('div');
                subNode.className = 'flow-node';
                subNode.style.borderColor = '#48bb78';
                subNode.style.backgroundColor = '#f0fff4';
                
                subNode.innerHTML = `
                    <span class="flow-node-title">Sustancia Farmacológica</span>
                    <span class="flow-node-name">${sub.name}</span>
                    <span class="flow-node-sctid">${sub.sctid}</span>
                    <div style="margin-top: 0.75rem;" class="btn-container"></div>
                `;
                
                const btn = createFindButton(diag.patologyId, sub.query, sub.atc);
                subNode.querySelector('.btn-container').appendChild(btn);
                card.appendChild(subNode);
            });
            
            treatmentsContainer.appendChild(card);
            
        } else if (activeMethodology === 'B') {
            if (!diag.methodologyB) {
                treatmentsContainer.innerHTML = '<p>Datos de mapeo cruzado no disponibles para este diagnóstico.</p>';
                return;
            }
            
            const card = document.createElement('div');
            card.className = 'snomed-pathway-flow';
            
            card.innerHTML = `
                <h4 style="margin-bottom: 1rem; color: var(--primary-color);">Puente CIE-10 y ATC</h4>
                
                <div class="pathway-step">
                    <div class="pathway-step-num">1</div>
                    <div class="pathway-step-content">
                        <span class="pathway-step-title">Diagnóstico SNOMED CT</span>
                        <span class="pathway-step-val">${diag.name} <span class="pathway-step-code">${diag.sctid}</span></span>
                    </div>
                </div>
                
                <div class="pathway-divider">⬇️ Map Extend SNOMED a CIE-10</div>
                
                <div class="pathway-step">
                    <div class="pathway-step-num" style="background: #4299e1;">2</div>
                    <div class="pathway-step-content">
                        <span class="pathway-step-title">Código CIE-10</span>
                        <span class="pathway-step-val">${diag.methodologyB.cie10Name} <span class="pathway-step-code">${diag.methodologyB.cie10Code}</span></span>
                    </div>
                </div>
                
                <div class="pathway-divider">⬇️ Cruce de Indicación</div>
                
                <div class="pathway-step">
                    <div class="pathway-step-num" style="background: #ed8936;">3</div>
                    <div class="pathway-step-content">
                        <span class="pathway-step-title">Familia ATC (Anatomical Therapeutic Chemical)</span>
                        <span class="pathway-step-val">${diag.methodologyB.atcName} <span class="pathway-step-code">${diag.methodologyB.atcCode}</span></span>
                    </div>
                </div>
                
                <div class="pathway-divider">⬇️ Búsqueda en Vademécum Nacional</div>
                
                <div class="pathway-step">
                    <div class="pathway-step-num" style="background: #48bb78;">4</div>
                    <div class="pathway-step-content">
                        <span class="pathway-step-title">Filtro de Catálogo</span>
                        <span class="pathway-step-val">Buscar equivalente comercial: ${diag.methodologyB.query}</span>
                        <div style="margin-top: 0.75rem;" class="btn-container"></div>
                    </div>
                </div>
            `;
            
            const btn = createFindButton(diag.patologyId, diag.methodologyB.query, diag.methodologyB.atcCode);
            card.querySelector('.btn-container').appendChild(btn);
            
            treatmentsContainer.appendChild(card);
            
        } else {
            // Methodology C (Existing)
            diag.treatments.forEach(tr => {
                const card = document.createElement('div');
                card.className = 'snomed-suggested-card';
                card.innerHTML = `
                    <div class="snomed-suggested-header">
                        <div class="snomed-suggested-title">
                            <h4>${tr.class}</h4>
                            <span class="sctid-text" style="font-size: 0.72rem; padding: 0.1rem 0.35rem; margin-top: 0.25rem; display: inline-block;">SCTID: ${tr.sctid}</span>
                        </div>
                    </div>
                    <div class="snomed-guideline-box">
                        <strong>Mecanismo / Guía Clínica:</strong><br/>
                        ${tr.guideline}
                    </div>
                    <div class="snomed-suggested-substances">
                        <span><strong>Fármacos sugeridos:</strong> ${tr.substances}</span>
                        <div class="btn-container" style="margin-top: 0.5rem;"></div>
                    </div>
                `;
                
                const btn = createFindButton(diag.patologyId, tr.substances.split(',')[0].trim(), tr.atc);
                card.querySelector('.btn-container').appendChild(btn);
                treatmentsContainer.appendChild(card);
            });
        }
    }

    // ========================================================
    // SNOMED SUB-TABS NAVIGATION & RENDERING LOGIC
    // ========================================================
    if (subtabPharmacotherapyBtn && subtabClinicalSupportBtn && subtabPriceHistoryBtn && 
        snomedPharmacotherapyView && snomedClinicalSupportView && snomedPriceHistoryView) {
        subtabPharmacotherapyBtn.addEventListener('click', () => {
            switchSnomedSubtab('pharmacotherapy');
        });
        subtabClinicalSupportBtn.addEventListener('click', () => {
            switchSnomedSubtab('clinical-support');
        });
        subtabPriceHistoryBtn.addEventListener('click', () => {
            switchSnomedSubtab('price-history');
        });
    }

    function switchSnomedSubtab(subtabName) {
        activeSnomedSubtab = subtabName;
        
        // Update active class on buttons
        subtabPharmacotherapyBtn.classList.toggle('active', subtabName === 'pharmacotherapy');
        subtabClinicalSupportBtn.classList.toggle('active', subtabName === 'clinical-support');
        if (subtabPriceHistoryBtn) {
            subtabPriceHistoryBtn.classList.toggle('active', subtabName === 'price-history');
        }
        
        // Toggle view containers display
        snomedPharmacotherapyView.style.display = (subtabName === 'pharmacotherapy') ? 'flex' : 'none';
        snomedClinicalSupportView.style.display = (subtabName === 'clinical-support') ? 'flex' : 'none';
        if (snomedPriceHistoryView) {
            snomedPriceHistoryView.style.display = (subtabName === 'price-history') ? 'flex' : 'none';
        }
        
        // Render appropriate contents
        if (subtabName === 'clinical-support' && currentSnomedDiag) {
            renderClinicalSupport(currentSnomedDiag);
        } else if (subtabName === 'price-history' && currentSnomedDiag) {
            renderPriceHistoryView(currentSnomedDiag);
        }
    }

    // ========================================================
    // CLINICAL SUPPORT RENDERING ENGINE
    // ========================================================
    function renderClinicalSupport(diag) {
        // Render 1: Calculadora
        renderCalculatorModule(diag);

        // Render 2: Ensayos Clínicos
        fetchClinicalTrialsModule(diag);

        // Render 3: PubMed
        fetchPubMedModule(diag);

        // Render 4: Pautas de Educación
        renderPatientEducationModule(diag);
    }

    // --- 1. Calculator Module ---
    function renderCalculatorModule(diag) {
        const container = document.getElementById('support-calculator-container');
        if (!container) return;

        const term = (diag.name || '').toLowerCase();
        const sctid = diag.sctid;
        
        let calcType = 'generic';
        if (sctid === '44054006' || term.includes('diabetes') || term.includes('diabét')) {
            calcType = 'ascvd';
        } else if (sctid === '38341003' || term.includes('hipertensión') || term.includes('presión alta') || term.includes('cardiopatía')) {
            calcType = 'ascvd';
        } else if (sctid === '195967001' || term.includes('asma') || term.includes('epoc') || term.includes('bronquitis') || term.includes('obstructiva')) {
            calcType = 'act';
        } else if (term.includes('renal') || term.includes('nefropatía') || term.includes('riñón') || term.includes('creatinina')) {
            calcType = 'ckdepi';
        } else if (term.includes('faringitis') || term.includes('amigdalitis') || term.includes('garganta')) {
            calcType = 'centor';
        }

        let html = '';
        if (calcType === 'ascvd') {
            const isDiabetic = sctid === '44054006' || term.includes('diabetes') || term.includes('diabét');
            html = `
                <div class="calc-form">
                    <p class="calc-rec-text" style="margin-bottom: 0.5rem; font-weight: 500;">Calculadora de Riesgo Cardiovascular Global a 10 años (ASCVD/Framingham):</p>
                    <div class="calc-row-2">
                        <div class="calc-group">
                            <label for="calc-age">Edad (Años)</label>
                            <input type="number" id="calc-age" min="20" max="79" value="55">
                        </div>
                        <div class="calc-group">
                            <label for="calc-sex">Sexo Biológico</label>
                            <select id="calc-sex">
                                <option value="male">Masculino</option>
                                <option value="female" selected>Femenino</option>
                            </select>
                        </div>
                    </div>
                    <div class="calc-row-2">
                        <div class="calc-group">
                            <label for="calc-sbp">P. A. Sistólica (mmHg)</label>
                            <input type="number" id="calc-sbp" min="90" max="200" value="135">
                        </div>
                        <div class="calc-group">
                            <label for="calc-diabetes">¿Tiene Diabetes?</label>
                            <select id="calc-diabetes">
                                <option value="yes" ${isDiabetic ? 'selected' : ''}>Sí</option>
                                <option value="no" ${!isDiabetic ? 'selected' : ''}>No</option>
                            </select>
                        </div>
                    </div>
                    <div class="calc-row-2">
                        <div class="calc-group">
                            <label for="calc-tc">Colesterol Total (mg/dL)</label>
                            <input type="number" id="calc-tc" min="130" max="320" value="210">
                        </div>
                        <div class="calc-group">
                            <label for="calc-hdl">Colesterol HDL (mg/dL)</label>
                            <input type="number" id="calc-hdl" min="20" max="100" value="45">
                        </div>
                    </div>
                    <div class="calc-group">
                        <label for="calc-smoker">¿Hábito Tabáquico?</label>
                        <select id="calc-smoker">
                            <option value="no" selected>No fuma</option>
                            <option value="yes">Fumador activo</option>
                        </select>
                    </div>
                    <button id="btn-calc-execute" class="btn-calc">Calcular Riesgo Cardiovascular</button>
                    <div id="calc-result" class="calc-result-box">
                        <span class="calc-score-val" id="calc-score-text">-</span>
                        <span class="calc-rec-text" id="calc-rec-text">-</span>
                    </div>
                </div>
            `;
        } else if (calcType === 'act') {
            html = `
                <div class="calc-form">
                    <p class="calc-rec-text" style="margin-bottom: 0.5rem; font-weight: 500;">Test de Control del Asma (ACT - Asthma Control Test):</p>
                    <div class="calc-group">
                        <label for="act-q1">1. Limitación de actividades diarias por asma</label>
                        <select id="act-q1">
                            <option value="1">Siempre (Muy limitado)</option>
                            <option value="2">Casi siempre</option>
                            <option value="3">Algunas veces</option>
                            <option value="4">Pocas veces</option>
                            <option value="5" selected>Nunca (Sin limitación)</option>
                        </select>
                    </div>
                    <div class="calc-group">
                        <label for="act-q2">2. Frecuencia de falta de aire (disnea)</label>
                        <select id="act-q2">
                            <option value="1">Más de una vez al día</option>
                            <option value="2">Una vez al día</option>
                            <option value="3">3 a 6 veces por semana</option>
                            <option value="4">1 a 2 veces por semana</option>
                            <option value="5" selected>Nunca</option>
                        </select>
                    </div>
                    <div class="calc-group">
                        <label for="act-q3">3. Despertar nocturno por síntomas</label>
                        <select id="act-q3">
                            <option value="1">4 o más noches por semana</option>
                            <option value="2">2 a 3 noches por semana</option>
                            <option value="3">Una vez por semana</option>
                            <option value="4">1 a 2 veces al mes</option>
                            <option value="5" selected>Nunca</option>
                        </select>
                    </div>
                    <div class="calc-group">
                        <label for="act-q4">4. Uso de inhalador de rescate (ej. Salbutamol)</label>
                        <select id="act-q4">
                            <option value="1">3 o más veces al día</option>
                            <option value="2">1 a 2 veces al día</option>
                            <option value="3">3 o más veces por semana</option>
                            <option value="4">1 o menos veces por semana</option>
                            <option value="5" selected>Nunca</option>
                        </select>
                    </div>
                    <div class="calc-group">
                        <label for="act-q5">5. Percepción del control de su asma</label>
                        <select id="act-q5">
                            <option value="1">No controlado</option>
                            <option value="2">Mal controlado</option>
                            <option value="3">Parcialmente controlado</option>
                            <option value="4">Bien controlado</option>
                            <option value="5" selected>Totalmente controlado</option>
                        </select>
                    </div>
                    <button id="btn-calc-execute" class="btn-calc">Calcular Score ACT</button>
                    <div id="calc-result" class="calc-result-box">
                        <span class="calc-score-val" id="calc-score-text">-</span>
                        <span class="calc-rec-text" id="calc-rec-text">-</span>
                    </div>
                </div>
            `;
        } else if (calcType === 'ckdepi') {
            html = `
                <div class="calc-form">
                    <p class="calc-rec-text" style="margin-bottom: 0.5rem; font-weight: 500;">Calculadora de Filtrado Glomerular Estimado (CKD-EPI):</p>
                    <div class="calc-group">
                        <label for="calc-scr">Creatinina Sérica (mg/dL)</label>
                        <input type="number" id="calc-scr" min="0.3" max="15.0" step="0.01" value="1.1">
                    </div>
                    <div class="calc-row-2">
                        <div class="calc-group">
                            <label for="calc-age">Edad (Años)</label>
                            <input type="number" id="calc-age" min="18" max="100" value="62">
                        </div>
                        <div class="calc-group">
                            <label for="calc-sex">Sexo Biológico</label>
                            <select id="calc-sex">
                                <option value="male" selected>Masculino</option>
                                <option value="female">Femenino</option>
                            </select>
                        </div>
                    </div>
                    <div class="calc-group">
                        <label for="calc-black">¿Paciente de etnia Negra?</label>
                        <select id="calc-black">
                            <option value="no" selected>No</option>
                            <option value="yes">Sí</option>
                        </select>
                    </div>
                    <button id="btn-calc-execute" class="btn-calc">Calcular TFG CKD-EPI</button>
                    <div id="calc-result" class="calc-result-box">
                        <span class="calc-score-val" id="calc-score-text">-</span>
                        <span class="calc-rec-text" id="calc-rec-text">-</span>
                    </div>
                </div>
            `;
        } else if (calcType === 'centor') {
            html = `
                <div class="calc-form">
                    <p class="calc-rec-text" style="margin-bottom: 0.5rem; font-weight: 500;">Criterios de Centor para Faringitis Estreptocócica:</p>
                    <div class="edu-checklist" style="margin-bottom: 0.5rem;">
                        <label class="edu-check-item">
                            <input type="checkbox" id="centor-fever">
                            Fiebre cuantificada > 38°C (+1)
                        </label>
                        <label class="edu-check-item">
                            <input type="checkbox" id="centor-exudate">
                            Hipertrofia o exudado amigdalino (+1)
                        </label>
                        <label class="edu-check-item">
                            <input type="checkbox" id="centor-adenopathy">
                            Adenopatías cervicales anteriores dolorosas (+1)
                        </label>
                        <label class="edu-check-item">
                            <input type="checkbox" id="centor-notough">
                            Ausencia de tos (+1)
                        </label>
                    </div>
                    <div class="calc-group">
                        <label for="centor-age">Edad del Paciente</label>
                        <select id="centor-age">
                            <option value="1">3 a 14 años (+1)</option>
                            <option value="0" selected>15 a 44 años (0)</option>
                            <option value="-1">45 años o más (-1)</option>
                        </select>
                    </div>
                    <button id="btn-calc-execute" class="btn-calc">Calcular Score de Centor</button>
                    <div id="calc-result" class="calc-result-box">
                        <span class="calc-score-val" id="calc-score-text">-</span>
                        <span class="calc-rec-text" id="calc-rec-text">-</span>
                    </div>
                </div>
            `;
        } else {
            // PHQ-3 Depression Screener
            html = `
                <div class="calc-form">
                    <p class="calc-rec-text" style="margin-bottom: 0.5rem; font-weight: 500;">Tamizaje Rápido de Salud Mental (PHQ-3):</p>
                    <div class="calc-group">
                        <label for="phq-q1">1. Poco interés o placer en hacer las cosas</label>
                        <select id="phq-q1">
                            <option value="0">Nunca</option>
                            <option value="1">Varios días</option>
                            <option value="2">Más de la mitad de los días</option>
                            <option value="3">Casi todos los días</option>
                        </select>
                    </div>
                    <div class="calc-group">
                        <label for="phq-q2">2. Sentirse decaído, deprimido o sin esperanzas</label>
                        <select id="phq-q2">
                            <option value="0">Nunca</option>
                            <option value="1">Varios días</option>
                            <option value="2">Más de la mitad de los días</option>
                            <option value="3">Casi todos los días</option>
                        </select>
                    </div>
                    <div class="calc-group">
                        <label for="phq-q3">3. Problemas de sueño (dormir poco o de más)</label>
                        <select id="phq-q3">
                            <option value="0">Nunca</option>
                            <option value="1">Varios días</option>
                            <option value="2">Más de la mitad de los días</option>
                            <option value="3">Casi todos los días</option>
                        </select>
                    </div>
                    <button id="btn-calc-execute" class="btn-calc">Calcular Evaluación</button>
                    <div id="calc-result" class="calc-result-box">
                        <span class="calc-score-val" id="calc-score-text">-</span>
                        <span class="calc-rec-text" id="calc-rec-text">-</span>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

        // Bind calculation execution
        const calcBtn = container.querySelector('#btn-calc-execute');
        if (calcBtn) {
            calcBtn.addEventListener('click', () => {
                executeCalculatorLogic(calcType);
            });
        }
    }

    function executeCalculatorLogic(calcType) {
        const resultBox = document.getElementById('calc-result');
        const scoreText = document.getElementById('calc-score-text');
        const recText = document.getElementById('calc-rec-text');
        
        if (!resultBox || !scoreText || !recText) return;

        resultBox.className = 'calc-result-box show';

        if (calcType === 'ascvd') {
            const age = parseInt(document.getElementById('calc-age').value) || 55;
            const sex = document.getElementById('calc-sex').value;
            const sbp = parseInt(document.getElementById('calc-sbp').value) || 120;
            const tc = parseInt(document.getElementById('calc-tc').value) || 200;
            const hdl = parseInt(document.getElementById('calc-hdl').value) || 50;
            const smoker = document.getElementById('calc-smoker').value === 'yes';
            const diabetes = document.getElementById('calc-diabetes').value === 'yes';

            let points = 0;
            points += Math.max(0, Math.floor((age - 20) / 5) * 1.5);
            points += Math.max(0, Math.floor((sbp - 110) / 10) * 2);
            points += Math.max(0, Math.floor((tc - 150) / 20) * 1.5);
            points += Math.max(0, Math.floor((60 - hdl) / 5) * 0.8);
            if (smoker) points += 4;
            if (diabetes) points += 5;
            if (sex === 'male') points += 2.5;

            const risk = Math.min(99.5, Math.max(0.5, points * 1.6));
            scoreText.textContent = `Riesgo: ${risk.toFixed(1)}%`;

            if (risk < 7.5) {
                resultBox.classList.add('risk-low');
                resultBox.classList.remove('risk-med', 'risk-high');
                recText.textContent = "Riesgo Cardiovascular Bajo a 10 años. Se sugiere fomentar hábitos saludables generales (dieta mediterránea, ejercicio regular) y monitorear periódicamente.";
            } else if (risk < 20.0) {
                resultBox.classList.add('risk-med');
                resultBox.classList.remove('risk-low', 'risk-high');
                recText.textContent = "Riesgo Cardiovascular Moderado. Considerar inicio de estatinas de moderada intensidad según el diálogo clínico. Optimizar control de PA e indicadores metabólicos.";
            } else {
                resultBox.classList.add('risk-high');
                resultBox.classList.remove('risk-low', 'risk-med');
                recText.textContent = "RIESGO CARDIOVASCULAR ALTO (Prevención Primaria Intensiva). Se recomienda tratamiento con estatinas de alta potencia. Monitoreo estricto de valores y control estricto de PA (<130/80 mmHg).";
            }

        } else if (calcType === 'act') {
            const q1 = parseInt(document.getElementById('act-q1').value) || 5;
            const q2 = parseInt(document.getElementById('act-q2').value) || 5;
            const q3 = parseInt(document.getElementById('act-q3').value) || 5;
            const q4 = parseInt(document.getElementById('act-q4').value) || 5;
            const q5 = parseInt(document.getElementById('act-q5').value) || 5;

            const score = q1 + q2 + q3 + q4 + q5;
            scoreText.textContent = `Puntuación: ${score} / 25`;

            if (score >= 20) {
                resultBox.classList.add('risk-low');
                resultBox.classList.remove('risk-med', 'risk-high');
                recText.textContent = "Asma Bien Controlada. El tratamiento actual es efectivo. Mantener régimen actual y revisar técnica de inhalación de mantenimiento.";
            } else if (score >= 16) {
                resultBox.classList.add('risk-med');
                resultBox.classList.remove('risk-low', 'risk-high');
                recText.textContent = "Asma Parcialmente Controlada. Se sugiere evaluar la adherencia al corticoide inhalado diario y corregir técnica de inhalador. Considerar escalar dosis temporalmente.";
            } else {
                resultBox.classList.add('risk-high');
                resultBox.classList.remove('risk-low', 'risk-med');
                recText.textContent = "ASMA NO CONTROLADA. Requiere ajuste del tratamiento de mantenimiento (escalar escalón GINA). Verificar factores desencadenantes y uso correcto de espaciador.";
            }

        } else if (calcType === 'ckdepi') {
            const scr = parseFloat(document.getElementById('calc-scr').value) || 1.0;
            const age = parseInt(document.getElementById('calc-age').value) || 60;
            const sex = document.getElementById('calc-sex').value;
            const isBlack = document.getElementById('calc-black').value === 'yes';

            const k = (sex === 'female') ? 0.7 : 0.9;
            const alpha = (sex === 'female') ? -0.329 : -0.411;
            const genderFactor = (sex === 'female') ? 1.018 : 1.0;
            const raceFactor = isBlack ? 1.159 : 1.0;

            const egfr = 141 * Math.pow(Math.min(scr / k, 1), alpha) * Math.pow(Math.max(scr / k, 1), -1.209) * Math.pow(0.993, age) * genderFactor * raceFactor;
            
            scoreText.textContent = `TFG Estimada: ${egfr.toFixed(0)} mL/min/1.73m²`;

            if (egfr >= 90) {
                resultBox.classList.add('risk-low');
                resultBox.classList.remove('risk-med', 'risk-high');
                recText.textContent = "Estadio G1 (Filtrado normal o aumentado). Sin indicación de daño renal a menos que haya proteinuria/microalbuminuria positiva. Control regular.";
            } else if (egfr >= 60) {
                resultBox.classList.add('risk-low');
                resultBox.classList.remove('risk-med', 'risk-high');
                recText.textContent = "Estadio G2 (Disminución leve). Habitual en senescencia. Controlar comorbilidades (Diabetes, Hipertensión) y monitorear anualmente.";
            } else if (egfr >= 30) {
                resultBox.classList.add('risk-med');
                resultBox.classList.remove('risk-low', 'risk-high');
                recText.textContent = "Estadio G3 (Disminución moderada). Evitar medicamentos nefrotóxicos (ej. AINEs). Ajustar dosis de drogas renales. Evaluar cociente albúmina/creatinina urinario.";
            } else if (egfr >= 15) {
                resultBox.classList.add('risk-high');
                resultBox.classList.remove('risk-low', 'risk-med');
                recText.textContent = "Estadio G4 (Disminución severa). Preparación para terapia de reemplazo renal. Derivación urgente a Nefrología. Evitar contrastes y monitorear potasio/fósforo.";
            } else {
                resultBox.classList.add('risk-high');
                resultBox.classList.remove('risk-low', 'risk-med');
                recText.textContent = "Estadio G5 (Falla renal terminal). Requiere diálisis o trasplante renal inminente. Manejo nefrológico continuo.";
            }

        } else if (calcType === 'centor') {
            const fever = document.getElementById('centor-fever').checked;
            const exudate = document.getElementById('centor-exudate').checked;
            const adenopathy = document.getElementById('centor-adenopathy').checked;
            const notough = document.getElementById('centor-notough').checked;
            const agePoints = parseInt(document.getElementById('centor-age').value) || 0;

            let score = 0;
            if (fever) score += 1;
            if (exudate) score += 1;
            if (adenopathy) score += 1;
            if (notough) score += 1;
            score += agePoints;

            scoreText.textContent = `Score de Centor: ${score} Puntos`;

            if (score <= 1) {
                resultBox.classList.add('risk-low');
                resultBox.classList.remove('risk-med', 'risk-high');
                recText.textContent = "Riesgo de infección bacteriana estreptocócica bajo (<10%). Tratamiento sintomático. No se aconseja estudio microbiológico ni antibióticos.";
            } else if (score <= 3) {
                resultBox.classList.add('risk-med');
                resultBox.classList.remove('risk-low', 'risk-high');
                recText.textContent = "Riesgo Intermedio (15-32%). Se sugiere realizar test de detección rápida de estreptococo (Strep A) o cultivo. Tratar con antibióticos únicamente ante confirmación.";
            } else {
                resultBox.classList.add('risk-high');
                resultBox.classList.remove('risk-low', 'risk-med');
                recText.textContent = "Riesgo Alto (>50%). Considerar test microbiológico rápido o tratamiento antibiótico empírico inmediato (ej. Penicilina o Amoxicilina) por 10 días.";
            }

        } else {
            // PHQ-3 Screener
            const q1 = parseInt(document.getElementById('phq-q1').value) || 0;
            const q2 = parseInt(document.getElementById('phq-q2').value) || 0;
            const q3 = parseInt(document.getElementById('phq-q3').value) || 0;

            const score = q1 + q2 + q3;
            scoreText.textContent = `Score PHQ-3: ${score} Puntos`;

            if (score <= 2) {
                resultBox.classList.add('risk-low');
                resultBox.classList.remove('risk-med', 'risk-high');
                recText.textContent = "Tamizaje Negativo. Sin sospecha clínica de sintomatología afectiva clínicamente significativa. Fomentar hábitos saludables.";
            } else if (score <= 5) {
                resultBox.classList.add('risk-med');
                resultBox.classList.remove('risk-low', 'risk-high');
                recText.textContent = "Sintomatología Depresiva Leve a Moderada. Se sugiere evaluar con cuestionario completo PHQ-9. Ofrecer psicoeducación y programar control en 2-4 semanas.";
            } else {
                resultBox.classList.add('risk-high');
                resultBox.classList.remove('risk-low', 'risk-med');
                recText.textContent = "SINTOMATOLOGÍA DEPRESIVA SEVERA. Se sugiere derivar a Salud Mental / Psiquiatría para evaluación formal diagnóstica y posible inicio de terapia dual (farmacológica + psicoterapia).";
            }
        }
    }

    // --- 2. Clinical Trials Module ---
    async function fetchClinicalTrialsModule(diag) {
        const container = document.getElementById('support-trials-container');
        if (!container) return;

        container.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted);">Buscando estudios en curso... ⏳</div>';
        
        try {
            const res = await fetch(`/api/snomed/clinical-trials/${diag.sctid}`);
            const trials = await res.json();
            
            container.innerHTML = '';
            
            if (trials.length === 0) {
                container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No se encontraron ensayos clínicos activos registrados para esta condición.</p>';
                return;
            }
            
            trials.forEach(trial => {
                const item = document.createElement('div');
                item.className = 'trial-item';
                
                const statusClass = 'trial-status-' + (trial.status || 'unknown').toLowerCase().replace(/_/g, '-');
                
                item.innerHTML = `
                    <span class="trial-nct">${trial.nctId}</span>
                    <span class="trial-title">${trial.title}</span>
                    <div class="trial-meta-row">
                        <span class="trial-badge ${statusClass}">${trial.status.replace(/_/g, ' ')}</span>
                        <span class="trial-badge trial-phase-badge">${trial.phase}</span>
                        <span class="trial-sponsor">${trial.sponsor}</span>
                    </div>
                    <a class="trial-link" href="https://clinicaltrials.gov/study/${trial.nctId}" target="_blank" rel="noopener noreferrer">Ver Ficha del Ensayo ↗</a>
                `;
                container.appendChild(item);
            });
        } catch (e) {
            console.error("Error al cargar ensayos clínicos:", e);
            container.innerHTML = '<p style="color: red; text-align: center;">Error al conectar con la base de datos de ClinicalTrials.gov.</p>';
        }
    }

    // --- 3. PubMed Module ---
    async function fetchPubMedModule(diag) {
        const container = document.getElementById('support-pubmed-container');
        if (!container) return;

        container.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted);">Buscando literatura científica... ⏳</div>';
        
        try {
            const res = await fetch(`/api/snomed/pubmed/${diag.sctid}`);
            const articles = await res.json();
            
            container.innerHTML = '';
            
            if (articles.length === 0) {
                container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No se encontraron publicaciones científicas recientes para esta condición.</p>';
                return;
            }
            
            articles.forEach(art => {
                const item = document.createElement('div');
                item.className = 'pubmed-item';
                
                item.innerHTML = `
                    <span class="pubmed-title">
                        <a href="https://pubmed.ncbi.nlm.nih.gov/${art.pmid}" target="_blank" rel="noopener noreferrer">${art.title}</a>
                    </span>
                    <div class="pubmed-meta">
                        <span class="pubmed-journal">${art.source}</span>
                        <span>PMID: ${art.pmid} | ${art.date}</span>
                    </div>
                `;
                container.appendChild(item);
            });
        } catch (e) {
            console.error("Error al cargar literatura científica:", e);
            container.innerHTML = '<p style="color: red; text-align: center;">Error al conectar con la base de datos de NCBI PubMed.</p>';
        }
    }

    // --- 4. Patient Education Module ---
    function renderPatientEducationModule(diag) {
        const container = document.getElementById('support-education-container');
        if (!container) return;

        const term = (diag.name || '').toLowerCase();
        const sctid = diag.sctid;
        
        let instructionsText = "";
        let checklistItems = [];
        
        if (sctid === '44054006' || term.includes('diabetes') || term.includes('diabét')) {
            instructionsText = "Mantenga una dieta baja en carbohidratos simples y grasas saturadas. Realice actividad física aeróbica moderada al menos 150 minutos a la semana. Revise e inspeccione sus pies diariamente para prevenir lesiones.";
            checklistItems = [
                "Controlar y registrar la glucemia en ayunas.",
                "Inspeccionar diariamente la planta de ambos pies buscando ampollas, grietas o heridas.",
                "Realizar caminatas de al menos 30 minutos al día.",
                "Tomar la medicación oral (ej. Metformina) con las comidas principales.",
                "Asistir a su control anual de fondo de ojo y función renal."
            ];
        } else if (sctid === '38341003' || term.includes('hipertensión') || term.includes('presión alta')) {
            instructionsText = "Reduzca el consumo de sal en sus platos a menos de 5g diarios (equivalente a 1 cucharadita). Realice ejercicio regular de intensidad moderada y evite fumar y el consumo excesivo de alcohol.";
            checklistItems = [
                "Medir la presión arterial dos veces al día (mañana y noche) antes de tomar los fármacos.",
                "No agregar sal de mesa a los platos preparados.",
                "Evitar embutidos, enlatados y productos ultraprocesados con alto contenido de sodio.",
                "Realizar actividad física aeróbica de bajo impacto.",
                "Acudir a urgencias si la presión supera 180/120 mmHg y presenta dolor de cabeza intenso o visión borrosa."
            ];
        } else if (sctid === '195967001' || term.includes('asma') || term.includes('epoc') || term.includes('bronquitis')) {
            instructionsText = "Evite la exposición al humo de tabaco, polvo y alérgenos conocidos. Asegúrese de realizar una técnica de inhalación correcta utilizando siempre aerocámara con sus inhaladores.";
            checklistItems = [
                "Utilizar el aerosol de mantenimiento (preventivo) diariamente según dosis prescrita.",
                "Llevar siempre consigo el aerosol de rescate (ej. Salbutamol).",
                "Enjuagar la boca con agua después de cada aplicación de corticoides inhalados.",
                "Lavar la aerocámara una vez por semana con agua tibia y dejar secar al aire.",
                "Monitorear la frecuencia respiratoria y consultar si requiere usar el rescate más de 3 veces por día."
            ];
        } else {
            // General clinical handout
            instructionsText = "Siga minuciosamente las indicaciones del médico. Guarde reposo adecuado, mantenga una correcta hidratación bebiendo abundante agua y monitoree la temperatura ante la sospecha de picos febriles.";
            checklistItems = [
                "Tomar la medicación en los horarios exactos indicados por el profesional.",
                "Consumir al menos 2 litros de agua diarios.",
                "Registrar los picos de temperatura si presenta sensación febril.",
                "Mantener reposo físico y reposar en un ambiente ventilado.",
                "Programar una cita de control si los síntomas persisten por más de 72 horas."
            ];
        }

        let listHtml = '';
        checklistItems.forEach((item, index) => {
            listHtml += `
                <label class="edu-check-item">
                    <input type="checkbox" id="edu-check-${index}" checked>
                    <span>${item}</span>
                </label>
            `;
        });

        container.innerHTML = `
            <div class="edu-block">
                <p class="edu-instructions">${instructionsText}</p>
                <div class="edu-checklist-title">📋 Checklist de autocuidado:</div>
                <div class="edu-checklist">
                    ${listHtml}
                </div>
                <button class="btn-print-handout" id="btn-print-patient-handout">
                    <span>🖨️</span> Imprimir Indicaciones
                </button>
            </div>
        `;

        // Bind print event
        const printBtn = container.querySelector('#btn-print-patient-handout');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                printPatientHandout(diag, instructionsText, checklistItems);
            });
        }
    }

    function printPatientHandout(diag, instructions, originalItems) {
        const printContainer = document.getElementById('print-patient-handout');
        if (!printContainer) return;

        // Clear other printable container to avoid overlap
        const printReceipt = document.getElementById('print-prescription-receipt');
        if (printReceipt) printReceipt.innerHTML = '';

        // Collect checked items
        const checkedItems = [];
        originalItems.forEach((item, index) => {
            const chk = document.getElementById(`edu-check-${index}`);
            if (chk && chk.checked) {
                checkedItems.push(item);
            }
        });

        const dateStr = new Date().toLocaleDateString('es-AR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        let listHtml = '';
        checkedItems.forEach(item => {
            listHtml += `<li>${item}</li>`;
        });

        printContainer.innerHTML = `
            <div class="print-handout-header">
                <div class="print-handout-title">Guía de Indicaciones al Paciente</div>
                <div style="font-size: 0.9rem; color: #4a5568;">Centro de Soporte Clínico Digital</div>
                <div class="print-handout-meta">
                    <div><strong>Paciente:</strong> Simulación de Paciente</div>
                    <div><strong>Fecha:</strong> ${dateStr}</div>
                    <div><strong>Diagnóstico Primario:</strong> ${diag.name} (SCTID: ${diag.sctid})</div>
                    <div><strong>Médico Tratante:</strong> Profesional Médico</div>
                </div>
            </div>
            
            <div class="print-handout-section">
                <h3>📋 Recomendaciones Generales</h3>
                <p class="print-handout-desc">${instructions}</p>
            </div>
            
            <div class="print-handout-section">
                <h3>✅ Tareas de Autocuidado y Seguimiento Diario</h3>
                <ul class="print-handout-list">
                    ${listHtml}
                </ul>
            </div>
            
            <div class="print-handout-section" style="margin-top: 3rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div style="font-size: 0.85rem; color: #718096; max-width: 60%;">
                        <em>Por favor, siga estas indicaciones al pie de la letra y tome la medicación prescrita. Si tiene síntomas inusuales o dolor severo, diríjase a la guardia médica de inmediato.</em>
                    </div>
                    <div class="print-signature-area">
                        <div class="print-signature-line"></div>
                        <span>Firma y Sello del Profesional</span>
                    </div>
                </div>
            </div>
            
            <div class="print-handout-footer">
                <span>Generado digitalmente por TuRemedioIdeal</span>
                <span>Página 1 de 1</span>
            </div>
        `;

        window.print();
    }

    // ========================================================
    // PRICE HISTORY AND INFLATION VIEW GENERATOR
    // ========================================================
    async function renderPriceHistoryView(diag) {
        if (!pathologyInflationBadge || !priceChartDrugSelector || !priceChartPresentationSelector || !snomedPriceHistoryView) return;

        // Reset display
        pathologyInflationBadge.textContent = "Cargando... ⏳";
        pathologyInflationBadge.className = "inflation-badge";
        priceChartDrugSelector.innerHTML = '<option value="">Cargando drogas... ⏳</option>';
        priceChartPresentationSelector.innerHTML = '<option value="">Seleccione una droga... ⏳</option>';
        if (priceDivergencePanel) priceDivergencePanel.style.display = 'none';

        // Destroy old chart if exists
        if (priceHistoryChartInstance) {
            priceHistoryChartInstance.destroy();
            priceHistoryChartInstance = null;
        }

        try {
            // Fetch pathology inflation and products in parallel
            const inflationPromise = fetch(`/api/pathology/${diag.patologyId}/inflation`).then(r => r.json());
            const productsPromise = fetch(`/api/pathology/${diag.patologyId}/products`).then(r => r.json());

            const [inflationData, products] = await Promise.all([inflationPromise, productsPromise]);

            // 1. Update general inflation badge
            const infVal = inflationData.inflation_pct || 0;
            pathologyInflationBadge.textContent = `${infVal > 0 ? '+' : ''}${infVal.toFixed(2)}%`;
            pathologyInflationBadge.className = "inflation-badge"; // reset classes
            if (infVal < 5) {
                pathologyInflationBadge.classList.add('inflation-low');
            } else if (infVal <= 20) {
                pathologyInflationBadge.classList.add('inflation-medium');
            } else {
                pathologyInflationBadge.classList.add('inflation-high');
            }

            if (!products || products.length === 0) {
                priceChartDrugSelector.innerHTML = '<option value="">Sin productos disponibles</option>';
                return;
            }

            // 2. Populate Drugs Selector
            // Extract unique drug names and exclude nulls
            const uniqueDrugs = [...new Set(products.map(p => p.drug_name).filter(Boolean))].sort();
            priceChartDrugSelector.innerHTML = '';
            
            uniqueDrugs.forEach(drug => {
                const opt = document.createElement('option');
                opt.value = drug;
                opt.textContent = drug;
                priceChartDrugSelector.appendChild(opt);
            });

            // Try to auto-select the recommended drug
            let defaultDrug = uniqueDrugs[0];
            if (diag.methodologyB && diag.methodologyB.query) {
                const queryLower = diag.methodologyB.query.toLowerCase();
                const matched = uniqueDrugs.find(d => d.toLowerCase().includes(queryLower) || queryLower.includes(d.toLowerCase()));
                if (matched) {
                    defaultDrug = matched;
                    priceChartDrugSelector.value = matched;
                }
            }

            // Setup Change listener
            priceChartDrugSelector.onchange = () => {
                const selectedDrug = priceChartDrugSelector.value;
                updatePresentationSelector(selectedDrug, products);
            };

            // Initial call to populate presentations
            updatePresentationSelector(defaultDrug, products);

        } catch (e) {
            console.error("Error al renderizar historial de precios:", e);
            pathologyInflationBadge.textContent = "Error ⚠️";
            pathologyInflationBadge.className = "inflation-badge inflation-high";
        }
    }

    function updatePresentationSelector(drugName, allProducts) {
        if (!priceChartPresentationSelector) return;
        priceChartPresentationSelector.innerHTML = '';

        // Filter products of this drug
        const drugProducts = allProducts.filter(p => p.drug_name === drugName);

        // Group by presentation keys
        const presentationMap = new Map();
        drugProducts.forEach(p => {
            const cleanPres = cleanForm(p.forma_farmaceutica);
            const label = `${p.potencia} ${p.unidad_potencia} ${cleanPres} x ${p.unidades} uds.`;
            const key = `${p.potencia}|${p.unidad_potencia}|${cleanPres}|${p.unidades}`;
            if (!presentationMap.has(key)) {
                presentationMap.set(key, { label: label, products: [] });
            }
            presentationMap.get(key).products.push(p);
        });

        // Populate presentation selector
        presentationMap.forEach((val, key) => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = val.label;
            priceChartPresentationSelector.appendChild(opt);
        });

        // Setup Change listener for presentations
        priceChartPresentationSelector.onchange = () => {
            const selectedKey = priceChartPresentationSelector.value;
            const group = presentationMap.get(selectedKey);
            if (group) {
                renderHistoricalPriceChart(group.products);
            }
        };

        // Render chart for the first presentation automatically
        if (presentationMap.size > 0) {
            const firstKey = presentationMap.keys().next().value;
            renderHistoricalPriceChart(presentationMap.get(firstKey).products);
        }
    }

    async function renderHistoricalPriceChart(matchingProducts) {
        const ctx = document.getElementById('priceHistoryChart');
        if (!ctx) return;

        // Destroy previous chart instance
        if (priceHistoryChartInstance) {
            priceHistoryChartInstance.destroy();
            priceHistoryChartInstance = null;
        }

        if (!matchingProducts || matchingProducts.length === 0) return;

        // Sort by price ASC to identify cheapest and most expensive
        matchingProducts.sort((a, b) => a.price - b.price);

        const cheapest = matchingProducts[0];
        const premium = matchingProducts[matchingProducts.length - 1];

        // If cheapest and premium are the same product (only 1 product matches), we only fetch one
        const isSingleProduct = cheapest.nro_registro === premium.nro_registro;

        try {
            const fetchHistory = async (nro_registro) => {
                const r = await fetch(`/api/products/price-history/${nro_registro}`);
                return r.json();
            };

            const dataCheapest = await fetchHistory(cheapest.nro_registro);
            const dataPremium = isSingleProduct ? [] : await fetchHistory(premium.nro_registro);

            // Format dates
            // Align dates from Jun 2025 to May 2026
            const datesOrdered = [
                '20250630', '20250731', '20250829', '20250930', '20251031', '20251128',
                '20251230', '20260130', '20260227', '20260331', '20260430', '20260529'
            ];
            
            const labels = datesOrdered.map(formatVersionDate);

            const mapCheapest = new Map(dataCheapest.map(d => [d.fecha, d.precio]));
            const mapPremium = new Map(dataPremium.map(d => [d.fecha, d.precio]));

            const cheapestPrices = datesOrdered.map(d => mapCheapest.get(d) || null);
            const premiumPrices = datesOrdered.map(d => mapPremium.get(d) || null);

            const datasets = [];

            // Add cheapest dataset (Generic)
            datasets.push({
                label: `Genérico/Económico: ${cheapest.brand_name} (${cheapest.lab_name})`,
                data: cheapestPrices,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                borderWidth: 3,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#10b981',
                pointHoverRadius: 7
            });

            if (!isSingleProduct) {
                // Add premium dataset (Brand)
                datasets.push({
                    label: `Marca/Premium: ${premium.brand_name} (${premium.lab_name})`,
                    data: premiumPrices,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.04)',
                    borderWidth: 3,
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: '#ef4444',
                    pointHoverRadius: 7
                });
            }

            // Render Chart.js
            priceHistoryChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: '#2d3748',
                                font: {
                                    family: 'Inter',
                                    size: 11,
                                    weight: 600
                                }
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label = label.split(':')[0] + ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += formatCurrency(context.parsed.y);
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                color: '#718096',
                                font: {
                                    family: 'Inter',
                                    size: 11
                                }
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            },
                            ticks: {
                                color: '#718096',
                                font: {
                                    family: 'Inter',
                                    size: 11
                                },
                                callback: function(value) {
                                    return '$' + value.toLocaleString('es-AR', {minimumFractionDigits: 0, maximumFractionDigits: 0});
                                }
                            }
                        }
                    }
                }
            });

            // 3. Update divergence information panel
            if (!isSingleProduct && priceDivergencePanel && divergencePercentage && divergenceSaving) {
                const divPct = ((premium.price - cheapest.price) / cheapest.price * 100).toFixed(0);
                const savingAmt = premium.price - cheapest.price;

                divergencePercentage.textContent = `+${divPct}% (Marca vs. Genérico)`;
                divergenceSaving.textContent = `${formatCurrency(savingAmt)} por caja`;
                priceDivergencePanel.style.display = 'block';
            } else if (priceDivergencePanel) {
                priceDivergencePanel.style.display = 'none';
            }

        } catch (e) {
            console.error("Error al graficar historial de precios:", e);
        }
    }

    // Helper to format date keys
    function formatVersionDate(dateStr) {
        const months = {
            '20250630': 'Jun 25',
            '20250731': 'Jul 25',
            '20250829': 'Ago 25',
            '20250930': 'Sep 25',
            '20251031': 'Oct 25',
            '20251128': 'Nov 25',
            '20251230': 'Dic 25',
            '20260130': 'Ene 26',
            '20260227': 'Feb 26',
            '20260331': 'Mar 26',
            '20260430': 'Abr 26',
            '20260529': 'May 26'
        };
        return months[dateStr] || dateStr;
    }

    // ==========================================
    // MODULE SWITCHER & PREPAGAS COMPARATOR (SSSalud)
    // ==========================================
    
    const navBtnMedicamentos = document.getElementById('nav-btn-medicamentos');
    const navBtnPrepagas = document.getElementById('nav-btn-prepagas');
    const viewAlfabetaContainer = document.getElementById('view-alfabeta-container');
    const viewPrepagasContainer = document.getElementById('view-prepagas-container');
    
    if (navBtnMedicamentos && navBtnPrepagas && viewAlfabetaContainer && viewPrepagasContainer) {
        navBtnMedicamentos.addEventListener('click', () => {
            navBtnMedicamentos.classList.add('active');
            navBtnPrepagas.classList.remove('active');
            viewAlfabetaContainer.style.display = 'grid';
            viewPrepagasContainer.style.display = 'none';
        });
        
        navBtnPrepagas.addEventListener('click', () => {
            navBtnPrepagas.classList.add('active');
            navBtnMedicamentos.classList.remove('active');
            viewPrepagasContainer.style.display = 'grid';
            viewAlfabetaContainer.style.display = 'none';
            
            // Auto run first compare when switching to prepagas view
            calculatePrepagaPrices();
        });
    }
    

    let prepagaPlans = [];
    let priceChart = null;
    
    const btnComparePrepagas = document.getElementById('btn-compare-prepagas');
    if (btnComparePrepagas) {
        btnComparePrepagas.addEventListener('click', calculatePrepagaPrices);
    }
    
    // Reactive updates on inputs change
    ['prepaga-age', 'prepaga-type', 'prepaga-region', 'prepaga-contributions', 'prepaga-sort', 'prepaga-group'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', calculatePrepagaPrices);
        }
    });

    // Close chart modal
    const closeChartModalBtn = document.getElementById('close-chart-modal');
    if (closeChartModalBtn) {
        closeChartModalBtn.addEventListener('click', () => {
            document.getElementById('prepaga-chart-modal').style.display = 'none';
        });
    }

    async function fetchPrepagaPlans(region) {
        try {
            const url = new URL('/api/prepagas/planes', window.location.origin);
            if (region && region !== 'Todas') {
                url.searchParams.append('region', region);
            }
            const response = await fetch(url);
            const data = await response.json();
            prepagaPlans = data;
        } catch (error) {
            console.error("Error fetching prepaga plans:", error);
        }
    }
    
    async function calculatePrepagaPrices() {
        const ageRange = document.getElementById('prepaga-age').value;
        const coverageType = document.getElementById('prepaga-type').value;
        const region = document.getElementById('prepaga-region').value;
        const contributions = document.getElementById('prepaga-contributions').value;
        const sortBy = document.getElementById('prepaga-sort').value;
        const groupByCompany = document.getElementById('prepaga-group').checked;
        const resultsContainer = document.getElementById('prepagas-results-content');
        
        if (!resultsContainer) return;
        
        // Fetch new data if needed (we just fetch every time region changes for simplicity, or we can fetch all and filter)
        // Here we just fetch fresh data based on region selection
        await fetchPrepagaPlans(region);
        
        resultsContainer.innerHTML = '';
        
        // Filter plans
        let filteredPlans = prepagaPlans;
        if (coverageType === 'no-copago') {
            filteredPlans = prepagaPlans.filter(p => p.permite_copago === 0);
        } else if (coverageType === 'copago') {
            filteredPlans = prepagaPlans.filter(p => p.permite_copago === 1);
        }

        // Age factor calculation (mock factors)
        const ageFactors = { "18-25": 0.8, "26-35": 1.0, "36-45": 1.3, "46-59": 1.7, "60+": 2.5 };
        const ageFactor = ageFactors[ageRange] || 1.0;
        
        // Map features (mocked based on 'tipificacion')
        // Calculate prices and map
        const calculatedResults = filteredPlans.map(plan => {
            const grossPrice = Math.round(plan.valor_capital * ageFactor);
            
            // Region adjustment logic is already handled by the DB base prices, but we can display the net.
            let regionDiscount = 0;
            
            // Contributions deduction
            let contributionDeduction = 0;
            if (contributions === 'monotributo') {
                contributionDeduction = 15000;
            } else if (contributions === 'dependencia') {
                contributionDeduction = 35000;
            }
            
            const netPrice = Math.max(0, grossPrice - regionDiscount - contributionDeduction);
            
            return {
                company: plan.nombre_comercial,
                plan: plan.nombre_plan,
                basePrice: plan.valor_capital,
                rnemp: plan.rnemp,
                codigo: plan.codigo_plan,
                copagos: plan.permite_copago === 1,
                features: ["Cobertura según SSSalud", `Tipo: ${plan.tipo_plan}`, `Región: ${plan.region}`],
                ageFactor,
                grossPrice,
                regionDiscount,
                contributionDeduction,
                netPrice
            };
        });
        
        if (groupByCompany) {
            // Group by company
            const grouped = {};
            calculatedResults.forEach(res => {
                if (!grouped[res.company]) {
                    grouped[res.company] = [];
                }
                grouped[res.company].push(res);
            });

            // Map into array of company groups
            const companyList = Object.keys(grouped).map(companyName => {
                const plans = grouped[companyName];
                // Sort plans by price ASC
                plans.sort((a, b) => a.netPrice - b.netPrice);
                
                const minPrice = plans[0].netPrice;
                const maxPrice = plans[plans.length - 1].netPrice;
                
                return {
                    company: companyName,
                    plans,
                    minPrice,
                    maxPrice
                };
            });
            
            // Sort companies list
            if (sortBy === 'price-asc') {
                companyList.sort((a, b) => a.minPrice - b.minPrice);
            } else if (sortBy === 'price-desc') {
                companyList.sort((a, b) => b.maxPrice - a.maxPrice);
            } else if (sortBy === 'alpha-asc') {
                companyList.sort((a, b) => a.company.localeCompare(b.company));
            }
            
            // Render Grouped Cards
            companyList.forEach(comp => {
                const card = document.createElement('article');
                card.className = 'prepaga-card';
                card.style.display = 'block';
                
                const brandClass = comp.company.toLowerCase().replace(/\s+/g, '');
                const avatarLetters = comp.company.substring(0, 2).toUpperCase();
                
                let priceRangeText = "";
                if (comp.plans.length === 1) {
                    priceRangeText = `${formatCurrency(comp.plans[0].netPrice)}`;
                } else {
                    priceRangeText = `${formatCurrency(comp.minPrice)} - ${formatCurrency(comp.maxPrice)}`;
                }
                
                const plansHtml = comp.plans.map((plan, index) => renderPlanRow(plan, index)).join('');
                
                card.innerHTML = `
                    <div class="prepaga-card-header" style="border-bottom: none; padding-bottom: 0.5rem;">
                        <div class="prepaga-brand-info">
                            <div class="prepaga-avatar brand-${brandClass}" style="background: var(--primary-color); color: white;">${avatarLetters}</div>
                            <div class="prepaga-names">
                                <span class="prepaga-company-name">${comp.company}</span>
                                <span class="prepaga-plan-name">${comp.plans.length} ${comp.plans.length === 1 ? 'plan disponible' : 'planes disponibles'}</span>
                            </div>
                        </div>
                        <div class="prepaga-price-tag">
                            <span class="prepaga-net-price" style="font-size: 1.4rem;">${priceRangeText}</span>
                            <span class="prepaga-price-label">Rango Mensual Neto</span>
                        </div>
                    </div>
                    
                    <div class="prepaga-card-plans-list" style="margin-top: 1rem;">
                        ${plansHtml}
                    </div>
                `;
                resultsContainer.appendChild(card);
            });
            
            const countBadge = document.getElementById('prepagas-count-badge');
            if (countBadge) {
                countBadge.textContent = `${calculatedResults.length} planes en ${companyList.length} empresas`;
            }
        } else {
            // Flat List Rendering
            if (sortBy === 'price-asc') {
                calculatedResults.sort((a, b) => a.netPrice - b.netPrice);
            } else if (sortBy === 'price-desc') {
                calculatedResults.sort((a, b) => b.netPrice - a.netPrice);
            } else if (sortBy === 'alpha-asc') {
                calculatedResults.sort((a, b) => a.company.localeCompare(b.company));
            }
            
            calculatedResults.forEach((plan, index) => {
                const card = document.createElement('article');
                card.className = 'prepaga-card';
                card.style.display = 'block';
                
                const brandClass = plan.company.toLowerCase().replace(/\s+/g, '');
                const avatarLetters = plan.company.substring(0, 2).toUpperCase();
                
                const plansHtml = renderPlanRow(plan, 0); // index 0 means expanded
                
                card.innerHTML = `
                    <div class="prepaga-card-header" style="border-bottom: none; padding-bottom: 0.5rem;">
                        <div class="prepaga-brand-info">
                            <div class="prepaga-avatar brand-${brandClass}" style="background: var(--primary-color); color: white;">${avatarLetters}</div>
                            <div class="prepaga-names">
                                <span class="prepaga-company-name">${plan.company}</span>
                                <span class="prepaga-plan-name">Plan Individual</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="prepaga-card-plans-list" style="margin-top: 0.5rem;">
                        ${plansHtml}
                    </div>
                `;
                resultsContainer.appendChild(card);
            });
            
            const countBadge = document.getElementById('prepagas-count-badge');
            if (countBadge) {
                countBadge.textContent = `${calculatedResults.length} planes encontrados`;
            }
        }
        
        bindAccordionEvents(resultsContainer);
        bindChartEvents(resultsContainer);
    }
    
    function renderPlanRow(plan, index) {
        const copagoBadge = plan.copagos ? `<span class="badge-copago">Con Copagos</span>` : '';
        const featuresHtml = plan.features.map(f => `
            <div class="prepaga-feature-item">
                <span class="prepaga-feature-icon">✓</span>
                <span>${f}</span>
            </div>
        `).join('');
        
        const isExpanded = index === 0;
        const displayStyle = isExpanded ? 'grid' : 'none';
        const activeClass = isExpanded ? 'active' : '';
        const arrowIcon = isExpanded ? '▲' : '▼';
        
        return `
            <div class="prepaga-plan-row-container">
                <div class="prepaga-plan-row-header ${activeClass}" data-plan-index="${index}">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span style="font-weight: 700; font-family: 'Outfit', sans-serif; font-size: 0.95rem; color: var(--text-main);">${plan.plan}</span>
                        ${copagoBadge}
                    </div>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <span style="font-weight: 800; font-size: 1.1rem; color: var(--primary-light);">${formatCurrency(plan.netPrice)}</span>
                        <span class="plan-toggle-arrow" style="font-size: 0.75rem; color: var(--text-muted); transition: transform 0.2s ease;">${arrowIcon}</span>
                    </div>
                </div>
                
                <div class="prepaga-plan-row-details" style="display: ${displayStyle};">
                    <div class="prepaga-features-list">
                        <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-color); margin-bottom: 0.5rem;">Beneficios Clave:</h4>
                        ${featuresHtml}
                        <button class="btn-show-chart" data-rnemp="${plan.rnemp}" data-codigo="${plan.codigo}" style="margin-top: 1rem; background: rgba(255,255,255,0.1); border: 1px solid var(--border-color); color: var(--text-color); padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">📈 Ver Evolución de Precio</button>
                    </div>
                    
                    <div class="prepaga-price-breakdown">
                        <h4 style="font-size: 0.82rem; font-weight: 700; color: var(--text-color); margin-bottom: 0.5rem;">Desglose de Tarifas SSSalud:</h4>
                        <div class="breakdown-row">
                            <span>Cuota Base por Edad (x${plan.ageFactor.toFixed(2)}):</span>
                            <span>${formatCurrency(plan.grossPrice)}</span>
                        </div>
                        ${plan.contributionDeduction > 0 ? `
                        <div class="breakdown-row" style="color: #38a169;">
                            <span>Descuento Aportes Laborales:</span>
                            <span>-${formatCurrency(plan.contributionDeduction)}</span>
                        </div>
                        ` : ''}
                        <div class="breakdown-row total">
                            <span>Neto a Pagar por mes:</span>
                            <span>${formatCurrency(plan.netPrice)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    function bindAccordionEvents(container) {
        container.querySelectorAll('.prepaga-plan-row-header').forEach(header => {
            header.addEventListener('click', () => {
                const rowContainer = header.closest('.prepaga-plan-row-container');
                const details = rowContainer.querySelector('.prepaga-plan-row-details');
                const arrow = header.querySelector('.plan-toggle-arrow');
                
                const isVisible = details.style.display === 'grid';
                
                if (isVisible) {
                    details.style.display = 'none';
                    header.classList.remove('active');
                    arrow.textContent = '▼';
                } else {
                    details.style.display = 'grid';
                    header.classList.add('active');
                    arrow.textContent = '▲';
                }
            });
        });
    }

    function bindChartEvents(container) {
        container.querySelectorAll('.btn-show-chart').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const rnemp = btn.getAttribute('data-rnemp');
                const codigo = btn.getAttribute('data-codigo');
                
                document.getElementById('prepaga-chart-modal').style.display = 'flex';
                
                try {
                    const response = await fetch(`/api/prepagas/evolucion/${rnemp}/${codigo}?edad_desde=18`);
                    const data = await response.json();
                    renderChart(data);
                } catch (err) {
                    console.error(err);
                }
            });
        });
    }

    function renderChart(data) {
        const ctx = document.getElementById('prepagaPriceChart').getContext('2d');
        if (priceChart) {
            priceChart.destroy();
        }
        
        const labels = data.map(d => {
            const str = d.periodo.toString();
            return str.substring(0,4) + '-' + str.substring(4,6);
        });
        const prices = data.map(d => d.valor_capital);
        
        priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Precio Base Historico',
                    data: prices,
                    borderColor: '#60A5FA',
                    backgroundColor: 'rgba(96, 165, 250, 0.2)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#E2E8F0' }
                    }
                },
                scales: {
                    x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    }
});

