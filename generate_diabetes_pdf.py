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
        
        # Margins are 54pt (0.75 inch) Left and Right.
        # A4 width = 595.27, height = 841.89
        left_margin = 54
        right_margin = 541.27
        
        # Don't draw headers/footers on page 1 (cover/title page)
        if self._pageNumber > 1:
            # Header
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#1A365D")) # Deep Navy
            self.drawString(left_margin, 802, "REPORTE COMPARATIVO DE PRECIOS")
            
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#718096"))
            self.drawRightString(right_margin, 802, "Medicamentos para Diabetes")
            
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
    # Format as Argentine currency: $ 12.345,67
    return f"$ {price:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def format_date(d_str):
    if len(d_str) == 8 and d_str.isdigit():
        return f"{d_str[6:8]}/{d_str[4:6]}/{d_str[0:4]}"
    return d_str

def main():
    dir_path = r"C:\Users\Juanma\Downloads\20260529_19719_TEXTO"
    db_path = os.path.join(dir_path, "alfabeta.db")
    pdf_path = os.path.join(dir_path, "reporte_diabetes_precios.pdf")
    
    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}")
        return
        
    print(f"Connecting to database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Query active products for diabetes-related actions
    query = """
    SELECT 
        a.codigo as action_code,
        a.descripcion as action_name,
        md.descripcion as drug_name,
        m.presentacion as presentation,
        m.nombre as brand_name,
        m.laboratorio_desc as lab_name,
        m.precio as price,
        m.fecha as price_date
    FROM manual m
    JOIN manextra me ON m.nro_registro = me.nro_registro
    JOIN acciofar a ON me.cod_acciofar = a.codigo
    JOIN monodro md ON me.cod_droga = md.codigo
    WHERE m.baja = 0 AND m.precio > 0 AND a.codigo IN (98, 103, 299, 328, 480, 905)
    ORDER BY a.codigo, md.descripcion, m.presentacion, m.precio ASC
    """
    
    cursor.execute(query)
    rows = cursor.fetchall()
    print(f"Retrieved {len(rows)} product records.")
    
    # Group data: Action -> Drug -> Presentation
    data_by_action = {}
    total_drugs = set()
    total_presentations = 0
    
    for row in rows:
        act_code, act_name, drug_name, pres, brand, lab, price, pdate = row
        
        # Clean text formatting
        act_name = act_name.strip().upper()
        drug_name = drug_name.strip().capitalize()
        pres = pres.strip()
        brand = brand.strip()
        lab = lab.strip()
        
        total_drugs.add(drug_name)
        
        if act_name not in data_by_action:
            data_by_action[act_name] = {}
            
        if drug_name not in data_by_action[act_name]:
            data_by_action[act_name][drug_name] = {}
            
        if pres not in data_by_action[act_name][drug_name]:
            data_by_action[act_name][drug_name][pres] = []
            total_presentations += 1
            
        data_by_action[act_name][drug_name][pres].append({
            'brand': brand,
            'lab': lab,
            'price': price,
            'date': pdate
        })
        
    print(f"Grouped into {len(data_by_action)} action classes, {len(total_drugs)} distinct drugs, and {total_presentations} presentations.")
    
    # Setup document
    print(f"Creating PDF at {pdf_path}...")
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )
    
    styles = getSampleStyleSheet()
    
    # Define custom styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=colors.HexColor("#1A365D"),
        spaceAfter=15,
        alignment=0
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
    
    # Table cell styles
    th_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )
    
    th_style_right = ParagraphStyle(
        'TableHeaderRight',
        parent=th_style,
        alignment=2
    )
    
    th_style_center = ParagraphStyle(
        'TableHeaderCenter',
        parent=th_style,
        alignment=1
    )
    
    td_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#2D3748")
    )
    
    td_style_bold = ParagraphStyle(
        'TableCellBold',
        parent=td_style,
        fontName='Helvetica-Bold'
    )
    
    td_style_right = ParagraphStyle(
        'TableCellRight',
        parent=td_style,
        alignment=2
    )
    
    td_style_center = ParagraphStyle(
        'TableCellCenter',
        parent=td_style,
        alignment=1
    )
    
    story = []
    
    # --- 1. COVER PAGE ---
    story.append(Spacer(1, 40))
    # Colored top decorative bar
    d_bar = Table([[""]], colWidths=[480], rowHeights=[6])
    d_bar.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#1A365D")),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(d_bar)
    story.append(Spacer(1, 25))
    
    story.append(Paragraph("Reporte Comparativo de Precios:<br/>Medicamentos para Diabetes", title_style))
    story.append(Paragraph("Comparativa de marcas comerciales agrupadas por principio activo y presentación", subtitle_style))
    
    intro_text = (
        "Este reporte técnico recopila y organiza los medicamentos activos de la base de datos "
        "<b>Alfabeta MFDigital (versión Junio 2025)</b> asociados al tratamiento de la diabetes. "
        "La información se clasifica por su acción farmacológica principal, principio activo (droga) y "
        "presentación farmacéutica comercial (dosis, forma farmacéutica y cantidad de unidades)."
    )
    story.append(Paragraph(intro_text, desc_style))
    
    intro_text_2 = (
        "<b>Objetivo del Reporte:</b> Facilitar la comparación rápida y directa de los precios sugeridos "
        "al público entre las marcas de distintos laboratorios farmacéuticos para una misma droga y presentación. "
        "Dentro de cada tabla de presentación, los productos se presentan ordenados de menor a mayor precio."
    )
    story.append(Paragraph(intro_text_2, desc_style))
    
    story.append(Spacer(1, 20))
    
    # Metadata Box
    metadata_data = [
        [Paragraph("Fecha de Generación:", metadata_title_style), Paragraph("11 de Junio de 2026", metadata_val_style)],
        [Paragraph("Base de Datos Origen:", metadata_title_style), Paragraph("Alfabeta MFDigital (Junio 2025)", metadata_val_style)],
        [Paragraph("Clases Terapéuticas:", metadata_title_style), Paragraph(f"{len(data_by_action)} acciones farmacológicas", metadata_val_style)],
        [Paragraph("Principios Activos:", metadata_title_style), Paragraph(f"{len(total_drugs)} drogas analizadas", metadata_val_style)],
        [Paragraph("Presentaciones:", metadata_title_style), Paragraph(f"{total_presentations} combinaciones de dosis y empaque", metadata_val_style)],
        [Paragraph("Total de Productos:", metadata_title_style), Paragraph(f"{len(rows)} presentaciones comerciales activas", metadata_val_style)]
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
    
    # --- 2. REPORT BODY ---
    # Sort action classes to have a consistent order
    sorted_actions = sorted(data_by_action.keys())
    
    for action in sorted_actions:
        story.append(Paragraph(action, action_style))
        # Horizontal line below action
        act_line = Table([[""]], colWidths=[480], rowHeights=[1.5])
        act_line.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#1A365D")),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(act_line)
        story.append(Spacer(1, 8))
        
        # Sort drugs in alphabetical order
        sorted_drugs = sorted(data_by_action[action].keys())
        for drug in sorted_drugs:
            story.append(Paragraph(drug, drug_style))
            
            # Sort presentations
            presentations = data_by_action[action][drug]
            sorted_pres = sorted(presentations.keys())
            
            for pres in sorted_pres:
                # We group each presentation header and its table to help avoid orphan headers
                pres_elements = []
                pres_elements.append(Paragraph(f"Presentación: {pres}", pres_style))
                
                # Table headers
                table_content = [[
                    Paragraph("Nombre Comercial", th_style),
                    Paragraph("Laboratorio", th_style),
                    Paragraph("Precio Sugerido", th_style_right),
                    Paragraph("Vigencia", th_style_center)
                ]]
                
                products = presentations[pres]
                for idx, prod in enumerate(products):
                    # Style cheaper products slightly different if we want, or just list them
                    # Within each presentation, the list is already sorted by price (ASC)
                    p_name = prod['brand']
                    l_name = prod['lab']
                    p_val = format_currency(prod['price'])
                    p_date = format_date(prod['date'])
                    
                    # Highlight cheapest brand in bold
                    b_style = td_style_bold if idx == 0 else td_style
                    
                    table_content.append([
                        Paragraph(p_name, b_style),
                        Paragraph(l_name, td_style),
                        Paragraph(p_val, td_style_right),
                        Paragraph(p_date, td_style_center)
                    ])
                
                # Column widths must sum 480 points
                t = Table(table_content, colWidths=[180, 150, 75, 75], repeatRows=1)
                
                # Generate TableStyle
                t_style = [
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#2B6CB0")),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('TOPPADDING', (0,0), (-1,-1), 4),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                    ('LEFTPADDING', (0,0), (-1,-1), 6),
                    ('RIGHTPADDING', (0,0), (-1,-1), 6),
                ]
                
                # Alternate rows colors
                for i in range(1, len(table_content)):
                    bg_color = colors.HexColor("#F7FAFC") if i % 2 == 0 else colors.white
                    t_style.append(('BACKGROUND', (0,i), (-1,i), bg_color))
                    t_style.append(('LINEBELOW', (0,i), (-1,i), 0.5, colors.HexColor("#E2E8F0")))
                
                t_style.append(('LINEBELOW', (0,-1), (-1,-1), 1, colors.HexColor("#CBD5E0")))
                t.setStyle(TableStyle(t_style))
                
                pres_elements.append(t)
                pres_elements.append(Spacer(1, 10))
                
                story.append(KeepTogether(pres_elements))
                
        # PageBreak after each Action to organize categories clearly
        story.append(PageBreak())
        
    # Remove trailing page break if present in the story
    if story and isinstance(story[-1], PageBreak):
        story.pop()
        
    # Build Document using NumberedCanvas
    doc.build(story, canvasmaker=NumberedCanvas)
    print("PDF generation completed successfully!")
    conn.close()

if __name__ == '__main__':
    main()
