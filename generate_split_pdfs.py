import sqlite3
import os
import datetime
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        self.doc_title = kwargs.pop('doc_title', "Reporte de Precios")
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        left_margin = 54
        right_margin = 541.27
        
        # Don't draw headers/footers on page 1 (cover page)
        if self._pageNumber > 1:
            # Header
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#1A365D")) # Deep Navy
            self.drawString(left_margin, 802, "REPORTE COMPARATIVO DE PRECIOS")
            
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#718096"))
            self.drawRightString(right_margin, 802, self.doc_title)
            
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.75)
            self.line(left_margin, 794, right_margin, 794)
            
            # Footer
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#718096"))
            self.drawString(left_margin, 40, "Fuente: Alfabeta MFDigital (Junio 2025) — Generado el 11/06/2026")
            
            page_text = f"Página {self._pageNumber} de {page_count}"
            self.drawRightString(right_margin, 40, page_text)
            
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.75)
            self.line(left_margin, 52, right_margin, 52)
            
        else:
            # First page footer metadata
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#718096"))
            self.drawString(left_margin, 40, "Fuente de datos: Alfabeta MFDigital (Junio 2025)")
            self.drawRightString(right_margin, 40, "Generado automáticamente por Antigravity AI")
            self.setStrokeColor(colors.HexColor("#CBD5E0"))
            self.setLineWidth(0.5)
            self.line(left_margin, 52, right_margin, 52)
            
        self.restoreState()

def format_currency(price):
    return f"$ {price:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def format_date(d_str):
    if len(d_str) == 8 and d_str.isdigit():
        return f"{d_str[6:8]}/{d_str[4:6]}/{d_str[0:4]}"
    return d_str

def format_percentage(price, min_price):
    if min_price <= 0:
        return "-"
    pct = ((price - min_price) / min_price) * 100
    if pct == 0:
        return "-"
    return f"+{pct:,.1f}%".replace(".", "X").replace(",", ".").replace("X", ",")

def clean_form(form):
    if not form:
        return ""
    form_lower = form.lower()
    if "comprimidos/pastillas" in form_lower or "comprimido" in form_lower:
        return "comp."
    if "liberación controlada" in form_lower or "liberacion controlada" in form_lower or "prolongada" in form_lower:
        return "comp. lib. prol."
    if "cápsulas/globulos" in form_lower or "capsula" in form_lower:
        return "cáps."
    if "líquidos/soluciones" in form_lower or "jarabe" in form_lower or "gotas" in form_lower or "suspension" in form_lower:
        return "sol."
    if "inyectables" in form_lower or "inyectable" in form_lower or "polvo iny" in form_lower:
        return "iny."
    return form_lower

def build_pdf(pdf_path, doc_title, data, title, subtitle, description, stats, show_percent=False):
    print(f"Building PDF: {os.path.basename(pdf_path)}...")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )
    
    styles = getSampleStyleSheet()
    
    # Define styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=28,
        textColor=colors.HexColor("#1A365D"),
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#4A5568"),
        spaceAfter=25
    )
    
    desc_style = ParagraphStyle(
        'CoverDesc',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#2D3748"),
        spaceAfter=15
    )
    
    metadata_title_style = ParagraphStyle(
        'MetadataTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        textColor=colors.HexColor("#2B6CB0")
    )
    
    metadata_val_style = ParagraphStyle(
        'MetadataValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=12,
        textColor=colors.HexColor("#2D3748")
    )
    
    action_style = ParagraphStyle(
        'ActionHeader',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1A365D"),
        spaceBefore=18,
        spaceAfter=8,
        keepWithNext=True
    )
    
    drug_style = ParagraphStyle(
        'DrugHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#2B6CB0"),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    pres_style = ParagraphStyle(
        'PresentationHeader',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#4A5568"),
        spaceBefore=6,
        spaceAfter=4,
        keepWithNext=True
    )
    
    th_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )
    th_style_right = ParagraphStyle('TableHeaderRight', parent=th_style, alignment=2)
    th_style_center = ParagraphStyle('TableHeaderCenter', parent=th_style, alignment=1)
    
    td_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#2D3748")
    )
    td_style_bold = ParagraphStyle('TableCellBold', parent=td_style, fontName='Helvetica-Bold')
    td_style_right = ParagraphStyle('TableCellRight', parent=td_style, alignment=2)
    td_style_center = ParagraphStyle('TableCellCenter', parent=td_style, alignment=1)
    
    story = []
    
    # --- COVER PAGE ---
    story.append(Spacer(1, 40))
    d_bar = Table([[""]], colWidths=[480], rowHeights=[6])
    d_bar.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#1A365D")),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(d_bar)
    story.append(Spacer(1, 25))
    
    story.append(Paragraph(title, title_style))
    story.append(Paragraph(subtitle, subtitle_style))
    story.append(Paragraph(description, desc_style))
    story.append(Spacer(1, 20))
    
    # Metadata Box
    metadata_data = [
        [Paragraph("Fecha de Generación:", metadata_title_style), Paragraph("11 de Junio de 2026", metadata_val_style)],
        [Paragraph("Base de Datos Origen:", metadata_title_style), Paragraph("Alfabeta MFDigital (Junio 2025)", metadata_val_style)],
        [Paragraph("Drogas Representadas:", metadata_title_style), Paragraph(f"{stats['drugs']} drogas", metadata_val_style)],
        [Paragraph("Presentaciones:", metadata_title_style), Paragraph(f"{stats['pres']} presentaciones comerciales", metadata_val_style)],
        [Paragraph("Total de Productos:", metadata_title_style), Paragraph(f"{stats['products']} medicamentos", metadata_val_style)]
    ]
    
    m_box = Table(metadata_data, colWidths=[150, 330])
    m_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F7FAFC")),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#E2E8F0")),
        ('INNERGRID', (0,0), (-1,-1), 0.25, colors.HexColor("#EDF2F7")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(m_box)
    story.append(PageBreak())
    
    # --- REPORT BODY ---
    sorted_actions = sorted(data.keys())
    for action in sorted_actions:
        story.append(Paragraph(action, action_style))
        act_line = Table([[""]], colWidths=[480], rowHeights=[1.5])
        act_line.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#1A365D")),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(act_line)
        story.append(Spacer(1, 8))
        
        sorted_drugs = sorted(data[action].keys())
        for drug in sorted_drugs:
            story.append(Paragraph(drug, drug_style))
            
            presentations = data[action][drug]
            sorted_pres = sorted(presentations.keys())
            
            for pres in sorted_pres:
                pres_elements = []
                pres_elements.append(Paragraph(f"Presentación: {pres}", pres_style))
                
                if show_percent:
                    col_widths = [160, 120, 70, 65, 65]
                    table_content = [[
                        Paragraph("Nombre Comercial", th_style),
                        Paragraph("Laboratorio", th_style),
                        Paragraph("Precio Sugerido", th_style_right),
                        Paragraph("% Increm.", th_style_right),
                        Paragraph("Vigencia", th_style_center)
                    ]]
                else:
                    col_widths = [180, 150, 75, 75]
                    table_content = [[
                        Paragraph("Nombre Comercial", th_style),
                        Paragraph("Laboratorio", th_style),
                        Paragraph("Precio Sugerido", th_style_right),
                        Paragraph("Vigencia", th_style_center)
                    ]]
                
                products = presentations[pres]
                min_price = products[0]['price'] if products else 0.0
                
                for idx, prod in enumerate(products):
                    p_name = prod['brand']
                    l_name = prod['lab']
                    p_val = format_currency(prod['price'])
                    p_date = format_date(prod['date'])
                    
                    # Bold highlight for cheapest brand if multiple alternatives exist
                    b_style = td_style_bold if (idx == 0 and len(products) > 1) else td_style
                    
                    if show_percent:
                        pct_val = format_percentage(prod['price'], min_price)
                        table_content.append([
                            Paragraph(p_name, b_style),
                            Paragraph(l_name, td_style),
                            Paragraph(p_val, td_style_right),
                            Paragraph(pct_val, td_style_right),
                            Paragraph(p_date, td_style_center)
                        ])
                    else:
                        table_content.append([
                            Paragraph(p_name, b_style),
                            Paragraph(l_name, td_style),
                            Paragraph(p_val, td_style_right),
                            Paragraph(p_date, td_style_center)
                        ])
                
                t = Table(table_content, colWidths=col_widths, repeatRows=1)
                
                t_style = [
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2B6CB0")),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('TOPPADDING', (0,0), (-1,-1), 4),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                    ('LEFTPADDING', (0,0), (-1,-1), 6),
                    ('RIGHTPADDING', (0,0), (-1,-1), 6),
                ]
                
                # Alignments
                if show_percent:
                    t_style.extend([
                        ('ALIGN', (2,0), (2,-1), 'RIGHT'),
                        ('ALIGN', (3,0), (3,-1), 'RIGHT'),
                        ('ALIGN', (4,0), (4,-1), 'CENTER'),
                    ])
                else:
                    t_style.extend([
                        ('ALIGN', (2,0), (2,-1), 'RIGHT'),
                        ('ALIGN', (3,0), (3,-1), 'CENTER'),
                    ])
                
                for i in range(1, len(table_content)):
                    bg_color = colors.HexColor("#F7FAFC") if i % 2 == 0 else colors.white
                    t_style.append(('BACKGROUND', (0,i), (-1,i), bg_color))
                    t_style.append(('LINEBELOW', (0,i), (-1,i), 0.5, colors.HexColor("#E2E8F0")))
                
                t_style.append(('LINEBELOW', (0,-1), (-1,-1), 1, colors.HexColor("#CBD5E0")))
                t.setStyle(TableStyle(t_style))
                
                pres_elements.append(t)
                pres_elements.append(Spacer(1, 10))
                
                story.append(KeepTogether(pres_elements))
                
        story.append(PageBreak())
        
    if story and isinstance(story[-1], PageBreak):
        story.pop()
        
    # Build PDF with custom canvasmaker to pass document title to NumberedCanvas
    def make_numbered_canvas(*args, **kwargs):
        return NumberedCanvas(*args, doc_title=doc_title, **kwargs)
        
    doc.build(story, canvasmaker=make_numbered_canvas)
    print(f"Finished building {os.path.basename(pdf_path)}.\n")

def main():
    dir_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO"
    db_path = os.path.join(dir_path, "alfabeta.db")
    
    pdf_single_path = os.path.join(dir_path, "reporte_diabetes_unica_alternativa.pdf")
    pdf_multi_path = os.path.join(dir_path, "reporte_diabetes_multiples_alternativas.pdf")
    
    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}")
        return
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    query = """
    SELECT 
        a.codigo as action_code,
        a.descripcion as action_name,
        md.descripcion as drug_name,
        m.presentacion as presentation,
        m.nombre as brand_name,
        m.laboratorio_desc as lab_name,
        m.precio as price,
        m.fecha as price_date,
        me.potencia,
        up.descripcion as unidad,
        f.descripcion as forma,
        m.unidades
    FROM manual m
    JOIN manextra me ON m.nro_registro = me.nro_registro
    JOIN acciofar a ON me.cod_acciofar = a.codigo
    JOIN monodro md ON me.cod_droga = md.codigo
    LEFT JOIN formas f ON me.cod_forma = f.codigo
    LEFT JOIN upotenci up ON me.cod_unidad_potencia = up.codigo
    WHERE m.baja = 0 AND m.precio > 0 AND a.codigo IN (98, 103, 299, 328, 480, 905)
    ORDER BY a.codigo, md.descripcion, me.potencia, m.unidades, m.precio ASC
    """
    
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()
    
    # 1. Group all products by Action -> Drug -> Presentation
    data_all = {}
    for row in rows:
        act_code, act_name, drug_name, pres_orig, brand, lab, price, pdate, pot, unit, form, units = row
        
        act_name = act_name.strip().upper()
        drug_name = drug_name.strip().capitalize()
        brand = brand.strip()
        lab = lab.strip()
        
        # Compose a standardized presentation
        form_clean = clean_form(form)
        pres = f"{pot or ''} {unit or ''} {form_clean} x {units or ''}".strip()
        # Fallback if empty or malformed
        if not pres or pres.startswith("x") or pres.endswith("x"):
            pres = pres_orig.strip()
            
        if act_name not in data_all:
            data_all[act_name] = {}
        if drug_name not in data_all[act_name]:
            data_all[act_name][drug_name] = {}
        if pres not in data_all[act_name][drug_name]:
            data_all[act_name][drug_name][pres] = []
            
        data_all[act_name][drug_name][pres].append({
            'brand': brand,
            'lab': lab,
            'price': price,
            'date': pdate
        })

    # 2. Split data into Single Alternative and Multiple Alternatives
    data_single = {}
    data_multiple = {}
    
    stats_single = {'drugs': set(), 'pres': 0, 'products': 0}
    stats_multiple = {'drugs': set(), 'pres': 0, 'products': 0}
    
    for action, drugs in data_all.items():
        for drug, presentations in drugs.items():
            for pres, products in presentations.items():
                qty = len(products)
                if qty == 1:
                    # Single Alternative
                    if action not in data_single:
                        data_single[action] = {}
                    if drug not in data_single[action]:
                        data_single[action][drug] = {}
                    data_single[action][drug][pres] = products
                    
                    stats_single['drugs'].add(drug)
                    stats_single['pres'] += 1
                    stats_single['products'] += 1
                else:
                    # Multiple Alternatives
                    if action not in data_multiple:
                        data_multiple[action] = {}
                    if drug not in data_multiple[action]:
                        data_multiple[action][drug] = {}
                    data_multiple[action][drug][pres] = products
                    
                    stats_multiple['drugs'].add(drug)
                    stats_multiple['pres'] += 1
                    stats_multiple['products'] += qty
                    
    # Format stats
    stats_single['drugs'] = len(stats_single['drugs'])
    stats_multiple['drugs'] = len(stats_multiple['drugs'])
    
    # 3. Build single alternative PDF
    title_single = "Reporte de Precios - Alternativa Única"
    sub_single = "Medicamentos para diabetes con una sola opción comercial en el mercado"
    desc_single = (
        "Este reporte contiene aquellas presentaciones comerciales de medicamentos para la diabetes "
        "(definidas por la combinación de droga activa, dosis y empaque) para las cuales existe "
        "<b>un único producto comercial activo</b> en la base de datos de Alfabeta (Junio 2025). "
        "Al no contar con competencia directa de otras marcas comerciales para la misma dosis y presentación, "
        "los precios aquí indicados no tienen alternativa de comparación."
    )
    build_pdf(
        pdf_single_path,
        doc_title="Medicamentos con Alternativa Única (Monopolio)",
        data=data_single,
        title=title_single,
        subtitle=sub_single,
        description=desc_single,
        stats=stats_single
    )
    
    # 4. Build multiple alternatives PDF
    title_multi = "Reporte de Precios - Múltiples Alternativas"
    sub_multi = "Presentaciones de medicamentos para diabetes con competencia y comparativa de precios"
    desc_multi = (
        "Este reporte técnico detalla los medicamentos para la diabetes para los cuales existen "
        "<b>múltiples alternativas comerciales</b> (marcas de distintos laboratorios farmacéuticos) para la misma "
        "droga activa y presentación (dosis, forma y cantidad). Dentro de cada tabla comparativa, "
        "los productos se listan <b>ordenados de menor a mayor precio</b>. La marca más económica se resalta en negrita "
        "y se incluye el porcentaje de incremento del precio con respecto a la opción más barata para cada presentación."
    )
    build_pdf(
        pdf_multi_path,
        doc_title="Medicamentos con Múltiples Alternativas (Comparativa)",
        data=data_multiple,
        title=title_multi,
        subtitle=sub_multi,
        description=desc_multi,
        stats=stats_multiple,
        show_percent=True
    )
    
    print("All PDFs built successfully!")

if __name__ == '__main__':
    main()
