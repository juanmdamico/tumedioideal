import re

modal_html = """
    <!-- Medicine Details Modal (formerly SNOMED) -->
    <div id="snomed-modal" class="snomed-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="snomed-modal-title" style="display: none;">
        <div class="snomed-modal-window">
            <div class="snomed-modal-header">
                <h3 id="snomed-modal-title"><span>💊</span> Ficha de Ahorro y Comparación</h3>
                <button id="snomed-modal-close" class="snomed-modal-close" aria-label="Cerrar modal">✕</button>
            </div>
            <div class="snomed-modal-body">
                <div class="snomed-concept-info">
                    <span id="snomed-concept-type-label" class="snomed-concept-type">Ficha de Medicamento</span>
                    <div id="medicine-detail-grid" class="snomed-meta-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-top: 1rem; margin-bottom: 1.5rem;">
                        <!-- Detail grid populated by JS -->
                    </div>
                </div>

                <div class="snomed-equivalents-section" style="margin-top: 1.5rem;">
                    <h4>🔄 Alternativas Comerciales (Misma Droga)</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">Comparativa de precios para la misma droga, presentación y cantidad. Elegir el de menor precio (MÍNIMO) garantiza la misma eficacia terapéutica pagando menos.</p>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Marca (Laboratorio)</th>
                                    <th>Precio</th>
                                    <th>Brecha %</th>
                                </tr>
                            </thead>
                            <tbody id="snomed-equivalents-body">
                                <!-- Equivalents populated by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="snomed-chart-section" style="margin-top: 2rem;">
                    <h4>📈 Evolución Histórica de Precio (12 meses)</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">Comparación de la inflación acumulada entre la marca seleccionada y la alternativa más económica del mercado.</p>
                    <div id="snomed-modal-chart-container" style="height: 250px; width: 100%; position: relative;">
                        <canvas id="snomedModalChart"></canvas>
                    </div>
                </div>

                <div class="snomed-class-section" style="margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
                    <h4>🧪 Otras Drogas de la misma Familia Terapéutica</h4>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">Si tu médico te permite cambiar de droga dentro de la misma familia terapéutica (<span id="snomed-action-name" style="font-weight: bold;"></span>), podés explorar estas alternativas.</p>
                    <div id="snomed-class-grid" class="snomed-class-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                        <!-- Class alternatives populated by JS -->
                    </div>
                </div>

                <div style="display:none;">
                    <span id="snomed-concept-term"></span>
                    <span id="snomed-concept-id"></span>
                    <span id="snomed-parent-term"></span>
                    <button id="btn-copy-snomed-id"></button>
                    <button id="btn-filter-snomed"></button>
                    <a id="lnk-snomed-browser"></a>
                    <button id="btn-copy-snomed-id-dynamic"></button>
                </div>
            </div>
        </div>
    </div>
"""

with open('templates/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Inject right before </body> or script tags
if '<!-- Medicine Details Modal (formerly SNOMED) -->' not in html:
    html = html.replace('<script src="/static/app.js"></script>', modal_html + '\n    <script src="/static/app.js"></script>')
    with open('templates/index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Modal injected successfully.")
else:
    print("Modal already present.")
