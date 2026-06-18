import re

with open('templates/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove Header Nav (SNOMED Tab)
html = re.sub(r'<!-- Navigation Tabs -->.*?</nav>', '', html, flags=re.DOTALL)

# Remove Global Coverage Config
html = re.sub(r'<!-- Configuración de Cobertura de Obra Social.*?</div>\s*</div>\s*</div>', '', html, flags=re.DOTALL)

# Remove SNOMED View
html = re.sub(r'<!-- SNOMED CT Clinical Treatments Consultor View -->.*?</main>', '', html, flags=re.DOTALL)

# Remove SNOMED Modal
html = re.sub(r'<!-- SNOMED CT Concept Details Modal -->.*?</div>\s*</div>\s*</div>', '', html, flags=re.DOTALL)

with open('templates/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('static/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Add WhatsApp logic in JS
whatsapp_btn = """
                <button id="btn-whatsapp-share" class="btn-whatsapp-action" style="background-color: #25D366; border: none; font-weight: 700; width: 100%; display: flex; justify-content: center; align-items: center; gap: 0.5rem; color: white; border-radius: 6px; padding: 0.75rem; cursor: pointer; margin-top: 0.5rem;">
                    <span style="font-size: 1.1rem;">📱</span> Enviar a WhatsApp
                </button>
"""
js = js.replace('<button id="btn-clear-prescription"', whatsapp_btn + '                <button id="btn-clear-prescription"')

# Add event listener for WhatsApp
whatsapp_logic = """
    prescriptionBody.addEventListener('click', (e) => {
        if (e.target.id === 'btn-whatsapp-share' || e.target.closest('#btn-whatsapp-share')) {
            shareToWhatsApp();
        }
"""
js = js.replace("prescriptionBody.addEventListener('click', (e) => {\n        const discountBtn", whatsapp_logic + "\n        const discountBtn")

# Add shareToWhatsApp function
share_func = """
    function shareToWhatsApp() {
        let text = "🛒 *Mi Carrito de Farmacia* (TuRemedioIdeal)\\n\\n";
        let total = 0;
        prescriptionCart.forEach(item => {
            const discount = typeof item.discount === 'number' ? item.discount : 40;
            const price = item.price * (1 - discount / 100);
            total += price;
            text += `🔹 *${item.brand_name}* (${item.lab_name})\\n`;
            text += `   ${item.drug_name} ${item.potencia}\\n`;
            text += `   Precio c/ ${discount}% desc: $${price.toFixed(2)}\\n\\n`;
        });
        text += `💰 *Total a pagar aprox:* $${total.toFixed(2)}\\n`;
        
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }
"""
js = js.replace("// 9. Formatting Helpers", share_func + "\n    // 9. Formatting Helpers")

# Remove unused badges from renderDrugBody
badges_to_remove = r'// Format Sale Condition.*?const reverseNavBadge = prod\.atc_code \? `<span class="meta-badge clickable-badge".*?🏥 Indicaciones Clínicas \(Inversa\)</span>` : \'\';'
js = re.sub(badges_to_remove, '', js, flags=re.DOTALL)

with open('static/app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("HTML and JS refactored")
