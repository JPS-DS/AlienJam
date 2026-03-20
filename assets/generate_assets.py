#!/usr/bin/env python3
"""
AlienJam Asset Generator - Creates premium SVG assets for the game
"""

import os
import random

ASSETS_DIR = "/Users/homeserver/clawd/projects/AlienJam/assets"

def svg_header(width, height, viewBox=None):
    if viewBox is None:
        viewBox = f"0 0 {width} {height}"
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewBox}" width="{width}" height="{height}">
<defs>'''

def svg_footer():
    return "</svg>"

# ============================================================================
# BACKGROUNDS
# ============================================================================

def generate_hub_background():
    """Hub Planet - Main social area with warm, inviting atmosphere"""
    svg = svg_header(1920, 1080)
    
    # Gradient definitions
    svg += '''
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#1a0a2e"/>
      <stop offset="30%" style="stop-color:#2d1b4e"/>
      <stop offset="60%" style="stop-color:#4a2c6a"/>
      <stop offset="100%" style="stop-color:#6b3d8a"/>
    </linearGradient>
    
    <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0"/>
    </radialGradient>
    
    <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#3d2a5c"/>
      <stop offset="100%" style="stop-color:#1f1533"/>
    </linearGradient>
    
    <linearGradient id="buildingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#5a3d7a"/>
      <stop offset="50%" style="stop-color:#7a5a9a"/>
      <stop offset="100%" style="stop-color:#5a3d7a"/>
    </linearGradient>
    
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    '''
    svg += "</defs>\n"
    
    # Sky
    svg += '<rect width="100%" height="100%" fill="url(#skyGrad)"/>\n'
    
    # Stars
    for _ in range(100):
        x = random.randint(0, 1920)
        y = random.randint(0, 500)
        r = random.uniform(0.5, 2)
        opacity = random.uniform(0.3, 1)
        svg += f'<circle cx="{x}" cy="{y}" r="{r}" fill="white" opacity="{opacity}"/>\n'
    
    # Two moons
    svg += '<circle cx="1600" cy="150" r="60" fill="#e8d5f0" filter="url(#glow)"/>\n'
    svg += '<circle cx="1550" cy="130" r="40" fill="#d4c0e6" opacity="0.8"/>\n'
    svg += '<circle cx="300" cy="200" r="35" fill="#c9b8e0" filter="url(#glow)"/>\n'
    
    # Distant mountains
    svg += '<path d="M0 600 Q200 400 400 550 Q600 450 800 500 Q1000 380 1200 480 Q1400 400 1600 500 Q1800 420 1920 520 L1920 700 L0 700 Z" fill="#2a1a4a" opacity="0.6"/>\n'
    
    # Ground
    svg += '<rect y="700" width="1920" height="380" fill="url(#groundGrad)"/>\n'
    
    # Glowing plants
    for i in range(20):
        x = random.randint(50, 1870)
        h = random.randint(30, 80)
        color = random.choice(['#00ffaa', '#ff66cc', '#66ccff', '#ffcc00'])
        svg += f'<ellipse cx="{x}" cy="720" rx="15" ry="{h}" fill="{color}" opacity="0.6" filter="url(#glow)"/>\n'
    
    # Buildings/Hubs
    buildings = [
        (200, 300, '#6a4a8a'),
        (500, 250, '#7a5a9a'),
        (1400, 280, '#5a3a7a'),
        (1700, 320, '#8a6aaa'),
    ]
    
    for bx, bw, color in buildings:
        bh = random.randint(200, 350)
        svg += f'''
        <rect x="{bx}" y="{700-bh}" width="{bw}" height="{bh}" fill="{color}" rx="10"/>
        <rect x="{bx+20}" y="{700-bh+30}" width="40" height="50" fill="#ffcc66" opacity="0.8" rx="5"/>
        <rect x="{bx+80}" y="{700-bh+30}" width="40" height="50" fill="#ffcc66" opacity="0.8" rx="5"/>
        <rect x="{bx+50}" y="{700-bh+100}" width="60" height="80" fill="#2a1a4a" rx="5"/>
        '''
    
    # Floating platforms
    for i in range(5):
        x = random.randint(100, 1700)
        y = random.randint(450, 600)
        svg += f'''
        <ellipse cx="{x}" cy="{y}" rx="80" ry="20" fill="#4a3a6a" filter="url(#glow)"/>
        <ellipse cx="{x}" cy="{y-5}" rx="70" ry="15" fill="#6a5a8a"/>
        '''
    
    svg += svg_footer()
    
    with open(f"{ASSETS_DIR}/backgrounds/hub_planet.svg", "w") as f:
        f.write(svg)
    print("✓ Hub background generated")

def generate_cave_background():
    """Crystal Cave - Mysterious underground cavern"""
    svg = svg_header(1920, 1080)
    
    svg += '''
    <linearGradient id="caveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a1a"/>
      <stop offset="50%" style="stop-color:#1a1a3a"/>
      <stop offset="100%" style="stop-color:#0a0a2a"/>
    </linearGradient>
    
    <linearGradient id="crystalGrad1" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" style="stop-color:#4a00aa"/>
      <stop offset="100%" style="stop-color:#cc66ff"/>
    </linearGradient>
    
    <linearGradient id="crystalGrad2" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" style="stop-color:#00aa88"/>
      <stop offset="100%" style="stop-color:#66ffdd"/>
    </linearGradient>
    
    <linearGradient id="crystalGrad3" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" style="stop-color:#aa0066"/>
      <stop offset="100%" style="stop-color:#ff66aa"/>
    </linearGradient>
    
    <filter id="crystalGlow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <radialGradient id="lightBeam" cx="50%" cy="0%" r="100%">
      <stop offset="0%" style="stop-color:#6666ff;stop-opacity:0.3"/>
      <stop offset="100%" style="stop-color:#6666ff;stop-opacity:0"/>
    </radialGradient>
    '''
    svg += "</defs>\n"
    
    # Cave background
    svg += '<rect width="100%" height="100%" fill="url(#caveGrad)"/>\n'
    
    # Cave ceiling (stalactites)
    for i in range(30):
        x = random.randint(0, 1920)
        h = random.randint(50, 200)
        points = f"{x},0 {x-20},{h} {x+20},{h}"
        svg += f'<polygon points="{points}" fill="#1a1a3a"/>\n'
    
    # Light beams from above
    for i in range(3):
        x = random.randint(200, 1700)
        svg += f'<ellipse cx="{x}" cy="400" rx="100" ry="500" fill="url(#lightBeam)"/>\n'
    
    # Giant crystals
    crystal_positions = [
        (300, 800, 150, 'crystalGrad1'),
        (600, 750, 200, 'crystalGrad2'),
        (1000, 850, 180, 'crystalGrad3'),
        (1400, 780, 220, 'crystalGrad1'),
        (1700, 820, 160, 'crystalGrad2'),
    ]
    
    for cx, cy, h, grad in crystal_positions:
        # Main crystal
        points = f"{cx},{cy-h} {cx-40},{cy} {cx+40},{cy}"
        svg += f'<polygon points="{points}" fill="url(#{grad})" filter="url(#crystalGlow)"/>\n'
        # Smaller crystals
        for _ in range(3):
            ox = cx + random.randint(-60, 60)
            oh = random.randint(30, 80)
            points2 = f"{ox},{cy-oh} {ox-20},{cy} {ox+20},{cy}"
            svg += f'<polygon points="{points2}" fill="url(#{grad})" opacity="0.7" filter="url(#crystalGlow)"/>\n'
    
    # Floating particles
    for _ in range(50):
        x = random.randint(0, 1920)
        y = random.randint(0, 1080)
        r = random.uniform(1, 4)
        color = random.choice(['#cc66ff', '#66ffdd', '#ff66aa'])
        svg += f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}" opacity="0.6" filter="url(#crystalGlow)"/>\n'
    
    # Ground with crystals
    svg += '<rect y="900" width="1920" height="180" fill="#0a0a2a"/>\n'
    
    # Small ground crystals
    for i in range(40):
        x = random.randint(0, 1920)
        h = random.randint(20, 60)
        grad = random.choice(['crystalGrad1', 'crystalGrad2', 'crystalGrad3'])
        points = f"{x},900 {x-10},{900-h} {x+10},{900-h}"
        svg += f'<polygon points="{points}" fill="url(#{grad})" filter="url(#crystalGlow)"/>\n'
    
    svg += svg_footer()
    
    with open(f"{ASSETS_DIR}/backgrounds/crystal_cave.svg", "w") as f:
        f.write(svg)
    print("✓ Crystal Cave background generated")

def generate_market_background():
    """Alien Market - Bustling trading hub"""
    svg = svg_header(1920, 1080)
    
    svg += '''
    <linearGradient id="marketSky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#1a0a0a"/>
      <stop offset="50%" style="stop-color:#3a1a2a"/>
      <stop offset="100%" style="stop-color:#5a2a3a"/>
    </linearGradient>
    
    <linearGradient id="neon1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ff0066"/>
      <stop offset="100%" style="stop-color:#ff66aa"/>
    </linearGradient>
    
    <linearGradient id="neon2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00ffcc"/>
      <stop offset="100%" style="stop-color:#66ffee"/>
    </linearGradient>
    
    <linearGradient id="neon3" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ffcc00"/>
      <stop offset="100%" style="stop-color:#ffee66"/>
    </linearGradient>
    
    <filter id="neonGlow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <filter id="signGlow">
      <feGaussianBlur stdDeviation="2"/>
    </filter>
    '''
    svg += "</defs>\n"
    
    # Sky
    svg += '<rect width="100%" height="100%" fill="url(#marketSky)"/>\n'
    
    # Stars
    for _ in range(80):
        x = random.randint(0, 1920)
        y = random.randint(0, 400)
        r = random.uniform(0.5, 1.5)
        svg += f'<circle cx="{x}" cy="{y}" r="{r}" fill="white" opacity="0.5"/>\n'
    
    # Ground
    svg += '<rect y="700" width="1920" height="380" fill="#1a0a1a"/>\n'
    svg += '<rect y="700" width="1920" height="10" fill="#ff0066" opacity="0.3" filter="url(#neonGlow)"/>\n'
    
    # Market stalls
    stalls = [
        (100, 'neon1', 'SPACE SNACKS'),
        (400, 'neon2', 'COSMIC CRYSTALS'),
        (700, 'neon3', 'ALIEN PETS'),
        (1000, 'neon1', 'TECH GADGETS'),
        (1300, 'neon2', 'RARE ARTIFACTS'),
        (1600, 'neon3', 'COSTUMES'),
    ]
    
    for sx, neon, name in stalls:
        # Stall structure
        svg += f'''
        <rect x="{sx}" y="550" width="200" height="150" fill="#2a1a2a" rx="5"/>
        <rect x="{sx+10}" y="560" width="180" height="100" fill="#1a0a1a"/>
        
        <!-- Neon sign -->
        <rect x="{sx+20}" y="510" width="160" height="35" fill="#0a0a0a" rx="5"/>
        <rect x="{sx+22}" y="512" width="156" height="31" fill="none" stroke="url(#{neon})" stroke-width="2" rx="4" filter="url(#neonGlow)"/>
        <text x="{sx+100}" y="535" text-anchor="middle" fill="url(#{neon})" font-family="Arial Black" font-size="14" filter="url(#signGlow)">{name}</text>
        
        <!-- Glow from stall -->
        <ellipse cx="{sx+100}" cy="700" rx="100" ry="30" fill="url(#{neon})" opacity="0.2"/>
        '''
        
        # Items in stall
        for _ in range(5):
            ix = sx + random.randint(20, 160)
            color = random.choice(['#ff66aa', '#66ffee', '#ffee66', '#aa66ff'])
            svg += f'<circle cx="{ix}" cy="620" r="10" fill="{color}" filter="url(#neonGlow)"/>\n'
    
    # Floating signs
    svg += '''
    <text x="960" y="200" text-anchor="middle" fill="url(#neon1)" font-family="Arial Black" font-size="80" filter="url(#neonGlow)">ALIEN MARKET</text>
    <text x="960" y="250" text-anchor="middle" fill="url(#neon2)" font-family="Arial" font-size="24" opacity="0.8">★ TRADING HUB ★</text>
    '''
    
    # Flying vehicles/drones
    for i in range(5):
        x = random.randint(100, 1800)
        y = random.randint(200, 500)
        svg += f'''
        <ellipse cx="{x}" cy="{y}" rx="30" ry="10" fill="#3a2a3a"/>
        <circle cx="{x}" cy="{y+5}" r="5" fill="#00ffcc" filter="url(#neonGlow)"/>
        '''
    
    # Neon lights on ground
    for i in range(20):
        x = random.randint(0, 1920)
        color = random.choice(['#ff0066', '#00ffcc', '#ffcc00'])
        svg += f'<rect x="{x}" y="705" width="40" height="3" fill="{color}" filter="url(#neonGlow)"/>\n'
    
    svg += svg_footer()
    
    with open(f"{ASSETS_DIR}/backgrounds/alien_market.svg", "w") as f:
        f.write(svg)
    print("✓ Alien Market background generated")

# ============================================================================
# CHARACTER SPRITES
# ============================================================================

def generate_alien_sprites():
    """Generate cute alien character sprites with animations"""
    
    species = ['blob', 'tentacle', 'crystal', 'bug']
    colors = ['#ff66aa', '#66ccff', '#aaff66', '#ffaa66', '#aa66ff', '#66ffcc']
    accessories = ['antenna', 'hat', 'glasses', 'bow', 'crown', 'scarf']
    
    # Base alien sprite sheet
    svg = svg_header(512, 512, "0 0 512 512")
    
    svg += '''
    <defs>
        <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#ff88cc"/>
            <stop offset="100%" style="stop-color:#cc44aa"/>
        </linearGradient>
        
        <filter id="softGlow">
            <feGaussianBlur stdDeviation="2"/>
        </filter>
        
        <radialGradient id="eyeShine" cx="30%" cy="30%" r="50%">
            <stop offset="0%" style="stop-color:#ffffff"/>
            <stop offset="100%" style="stop-color:#000000"/>
        </radialGradient>
    </defs>
    '''
    
    # Draw blob alien (3 poses: idle, walk1, walk2)
    for i, (cx, label) in enumerate([(128, "idle"), (256, "walk1"), (384, "walk2")]):
        cy = 256
        bounce = 10 if label == "walk1" else (-10 if label == "walk2" else 0)
        
        # Body
        svg += f'''
        <ellipse cx="{cx}" cy="{cy + bounce}" rx="60" ry="70" fill="url(#bodyGrad)">
            <animate attributeName="ry" values="70;68;70" dur="1s" repeatCount="indefinite"/>
        </ellipse>
        '''
        
        # Eyes
        svg += f'''
        <ellipse cx="{cx-20}" cy="{cy-10 + bounce}" rx="15" ry="18" fill="white"/>
        <ellipse cx="{cx+20}" cy="{cy-10 + bounce}" rx="15" ry="18" fill="white"/>
        <circle cx="{cx-20}" cy="{cy-8 + bounce}" r="8" fill="url(#eyeShine)"/>
        <circle cx="{cx+20}" cy="{cy-8 + bounce}" r="8" fill="url(#eyeShine)"/>
        <circle cx="{cx-18}" cy="{cy-12 + bounce}" r="3" fill="white"/>
        <circle cx="{cx+22}" cy="{cy-12 + bounce}" r="3" fill="white"/>
        '''
        
        # Smile
        svg += f'<path d="M {cx-25} {cy+20 + bounce} Q {cx} {cy+40 + bounce} {cx+25} {cy+20 + bounce}" fill="none" stroke="#aa3388" stroke-width="3" stroke-linecap="round"/>'
        
        # Little feet
        foot_offset = 5 if label == "walk1" else (-5 if label == "walk2" else 0)
        svg += f'''
        <ellipse cx="{cx-25 + foot_offset}" cy="{cy+70}" rx="18" ry="10" fill="#cc44aa"/>
        <ellipse cx="{cx+25 - foot_offset}" cy="{cy+70}" rx="18" ry="10" fill="#cc44aa"/>
        '''
        
        # Antenna
        svg += f'''
        <path d="M {cx} {cy-70 + bounce} L {cx} {cy-100 + bounce}" stroke="#cc44aa" stroke-width="4" fill="none"/>
        <circle cx="{cx}" cy="{cy-105 + bounce}" r="8" fill="#ffcc00" filter="url(#softGlow)">
            <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite"/>
        </circle>
        '''
    
    svg += svg_footer()
    
    with open(f"{ASSETS_DIR}/characters/blob_alien.svg", "w") as f:
        f.write(svg)
    print("✓ Blob alien sprite generated")
    
    # Generate tentacle alien
    svg2 = svg_header(512, 512, "0 0 512 512")
    svg2 += '''
    <defs>
        <linearGradient id="tentacleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#66ddff"/>
            <stop offset="100%" style="stop-color:#3399cc"/>
        </linearGradient>
    </defs>
    '''
    
    for i, (cx, label) in enumerate([(128, "idle"), (256, "walk1"), (384, "walk2")]):
        cy = 280
        sway = 5 if label == "walk1" else (-5 if label == "walk2" else 0)
        
        # Dome head
        svg2 += f'<ellipse cx="{cx}" cy="{cy-40}" rx="50" ry="45" fill="url(#tentacleGrad)"/>'
        
        # Big eye
        svg2 += f'''
        <ellipse cx="{cx}" cy="{cy-35}" rx="30" ry="35" fill="white"/>
        <circle cx="{cx + sway}" cy="{cy-30}" r="15" fill="#003366"/>
        <circle cx="{cx + sway - 5}" cy="{cy-38}" r="5" fill="white"/>
        '''
        
        # Tentacles
        for j in range(5):
            tx = cx - 40 + j * 20
            wave = sway * (1 if j % 2 == 0 else -1)
            svg2 += f'''
            <path d="M {tx} {cy+10} Q {tx + wave} {cy+50} {tx + wave*2} {cy+90}" 
                  stroke="url(#tentacleGrad)" stroke-width="12" fill="none" stroke-linecap="round">
                <animate attributeName="d" 
                    values="M {tx} {cy+10} Q {tx} {cy+50} {tx} {cy+90};M {tx} {cy+10} Q {tx+10} {cy+50} {tx+5} {cy+90};M {tx} {cy+10} Q {tx} {cy+50} {tx} {cy+90}" 
                    dur="{1.5 + j*0.1}s" repeatCount="indefinite"/>
            </path>
            '''
    
    svg2 += svg_footer()
    
    with open(f"{ASSETS_DIR}/characters/tentacle_alien.svg", "w") as f:
        f.write(svg2)
    print("✓ Tentacle alien sprite generated")

# ============================================================================
# UI ELEMENTS
# ============================================================================

def generate_ui_elements():
    """Generate glassmorphism UI elements"""
    
    # Chat panel
    svg = svg_header(400, 600, "0 0 400 600")
    svg += '''
    <defs>
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.2"/>
            <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0.05"/>
        </linearGradient>
        
        <filter id="glassBlur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10"/>
        </filter>
        
        <linearGradient id="buttonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#aa66ff"/>
            <stop offset="100%" style="stop-color:#6633aa"/>
        </linearGradient>
    </defs>
    
    <!-- Glass panel -->
    <rect x="10" y="10" width="380" height="580" rx="20" fill="url(#glassGrad)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
    
    <!-- Header -->
    <rect x="20" y="20" width="360" height="50" rx="10" fill="rgba(170,102,255,0.3)"/>
    <text x="200" y="52" text-anchor="middle" fill="white" font-family="Arial" font-size="20" font-weight="bold">💬 Chat</text>
    
    <!-- Messages area -->
    <rect x="20" y="80" width="360" height="420" rx="10" fill="rgba(0,0,0,0.2)"/>
    
    <!-- Sample messages -->
    <rect x="30" y="100" width="200" height="40" rx="10" fill="rgba(102,204,255,0.3)"/>
    <text x="40" y="115" fill="#66ccff" font-family="Arial" font-size="12" font-weight="bold">AlienJoe</text>
    <text x="40" y="130" fill="white" font-family="Arial" font-size="14">Hey everyone! 👋</text>
    
    <rect x="30" y="160" width="250" height="40" rx="10" fill="rgba(255,102,170,0.3)"/>
    <text x="40" y="175" fill="#ff66aa" font-family="Arial" font-size="12" font-weight="bold">SpaceQueen</text>
    <text x="40" y="190" fill="white" font-family="Arial" font-size="14">Welcome to the Hub! ✨</text>
    
    <!-- Input area -->
    <rect x="20" y="520" width="280" height="50" rx="25" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)"/>
    <text x="40" y="550" fill="rgba(255,255,255,0.5)" font-family="Arial" font-size="14">Type a message...</text>
    
    <!-- Send button -->
    <circle cx="360" cy="545" r="25" fill="url(#buttonGrad)"/>
    <text x="360" y="552" text-anchor="middle" fill="white" font-size="20">➤</text>
    '''
    svg += svg_footer()
    
    with open(f"{ASSETS_DIR}/ui/chat_panel.svg", "w") as f:
        f.write(svg)
    print("✓ Chat panel UI generated")
    
    # Navigation buttons
    svg2 = svg_header(200, 60, "0 0 200 60")
    svg2 += '''
    <defs>
        <linearGradient id="navGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#66ffcc"/>
            <stop offset="100%" style="stop-color:#33aa88"/>
        </linearGradient>
        
        <filter id="navGlow">
            <feGaussianBlur stdDeviation="3"/>
        </filter>
    </defs>
    
    <rect x="5" y="5" width="190" height="50" rx="25" fill="url(#navGrad)" filter="url(#navGlow)"/>
    <text x="100" y="38" text-anchor="middle" fill="white" font-family="Arial" font-size="18" font-weight="bold">🌍 Hub</text>
    '''
    svg2 += svg_footer()
    
    with open(f"{ASSETS_DIR}/ui/nav_button_hub.svg", "w") as f:
        f.write(svg2)
    print("✓ Navigation buttons generated")

# ============================================================================
# PROPS
# ============================================================================

def generate_props():
    """Generate decorative props"""
    
    # Space plant
    svg = svg_header(100, 150, "0 0 100 150")
    svg += '''
    <defs>
        <linearGradient id="plantGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style="stop-color:#00aa66"/>
            <stop offset="100%" style="stop-color:#66ffaa"/>
        </linearGradient>
        
        <radialGradient id="flowerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#ffccff"/>
            <stop offset="100%" style="stop-color:#ff66ff;stop-opacity:0"/>
        </radialGradient>
    </defs>
    
    <!-- Stem -->
    <path d="M 50 150 Q 45 100 50 60" stroke="url(#plantGrad)" stroke-width="8" fill="none"/>
    
    <!-- Leaves -->
    <ellipse cx="30" cy="90" rx="20" ry="10" fill="#00aa66" transform="rotate(-30 30 90)"/>
    <ellipse cx="70" cy="100" rx="20" ry="10" fill="#00aa66" transform="rotate(30 70 100)"/>
    
    <!-- Flower -->
    <circle cx="50" cy="40" r="25" fill="url(#flowerGlow)"/>
    <circle cx="50" cy="40" r="15" fill="#ff99ff"/>
    <circle cx="50" cy="40" r="8" fill="#ffcc00"/>
    
    <!-- Glow particles -->
    <circle cx="40" cy="20" r="3" fill="#ffffff" opacity="0.8">
        <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="60" cy="25" r="2" fill="#ffffff" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.5s" repeatCount="indefinite"/>
    </circle>
    '''
    svg += svg_footer()
    
    with open(f"{ASSETS_DIR}/props/space_plant.svg", "w") as f:
        f.write(svg)
    print("✓ Space plant prop generated")
    
    # Crystal cluster
    svg2 = svg_header(120, 100, "0 0 120 100")
    svg2 += '''
    <defs>
        <linearGradient id="crystal1" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" style="stop-color:#6600cc"/>
            <stop offset="100%" style="stop-color:#cc99ff"/>
        </linearGradient>
        
        <filter id="crystalGlow2">
            <feGaussianBlur stdDeviation="2"/>
        </filter>
    </defs>
    
    <polygon points="30,100 20,50 40,50" fill="url(#crystal1)" filter="url(#crystalGlow2)"/>
    <polygon points="60,100 45,30 75,30" fill="url(#crystal1)" filter="url(#crystalGlow2)"/>
    <polygon points="90,100 80,60 100,60" fill="url(#crystal1)" filter="url(#crystalGlow2)"/>
    <polygon points="50,100 40,70 60,70" fill="#9966dd" filter="url(#crystalGlow2)"/>
    '''
    svg2 += svg_footer()
    
    with open(f"{ASSETS_DIR}/props/crystal_cluster.svg", "w") as f:
        f.write(svg2)
    print("✓ Crystal cluster prop generated")

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    print("\n🛸 Generating AlienJam Asset Pack...\n")
    
    # Create directories
    for subdir in ['backgrounds', 'characters', 'ui', 'props', 'effects']:
        os.makedirs(f"{ASSETS_DIR}/{subdir}", exist_ok=True)
    
    # Generate all assets
    print("=== BACKGROUNDS ===")
    generate_hub_background()
    generate_cave_background()
    generate_market_background()
    
    print("\n=== CHARACTERS ===")
    generate_alien_sprites()
    
    print("\n=== UI ===")
    generate_ui_elements()
    
    print("\n=== PROPS ===")
    generate_props()
    
    print("\n✅ Asset pack complete!")
    print(f"📁 Assets saved to: {ASSETS_DIR}")
