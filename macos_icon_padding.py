#!/usr/bin/env python3
"""
macOS Icon Padding Tool
Adds proper safe-zone padding to icons for macOS Big Sur+ compatibility
"""

from PIL import Image, ImageDraw
import sys

def add_macos_padding(input_path, output_path, padding_percent=8.5):
    """
    Add padding to an icon to fit macOS safe zone requirements.
    
    Args:
        input_path: Path to source icon (should be square, ideally 1024x1024)
        output_path: Path to save the padded icon
        padding_percent: Percentage of padding to add (default 8.5% = ~87px on 1024x1024)
    """
    print(f"📖 Opening {input_path}...")
    img = Image.open(input_path)
    
    # Ensure we're working with RGBA
    if img.mode != 'RGBA':
        print(f"   Converting from {img.mode} to RGBA")
        img = img.convert('RGBA')
    
    # Get original size
    orig_width, orig_height = img.size
    print(f"   Original size: {orig_width}×{orig_height}")
    
    # Calculate padding
    padding = int(orig_width * (padding_percent / 100))
    print(f"   Adding {padding}px padding ({padding_percent}%) on each side")
    
    # Calculate new content size (reduced by padding)
    new_content_size = orig_width - (2 * padding)
    
    # Resize the original image to fit in the safe zone
    print(f"   Resizing content to {new_content_size}×{new_content_size}")
    resized = img.resize((new_content_size, new_content_size), Image.Resampling.LANCZOS)
    
    # Create new canvas with original size (1024x1024) and transparent background
    print(f"   Creating new {orig_width}×{orig_height} canvas")
    new_img = Image.new('RGBA', (orig_width, orig_height), (0, 0, 0, 0))
    
    # Paste the resized image centered in the new canvas
    paste_position = (padding, padding)
    new_img.paste(resized, paste_position, resized)
    
    # Save the result
    print(f"💾 Saving to {output_path}")
    new_img.save(output_path, 'PNG')
    
    print(f"✅ Done! Icon now has proper macOS safe-zone padding")
    print(f"   Content area: {new_content_size}×{new_content_size} (centered)")
    print(f"   Total canvas: {orig_width}×{orig_height}")
    
    return new_img

def preview_comparison(original_path, padded_path):
    """Show a visual comparison of before/after"""
    try:
        import matplotlib.pyplot as plt
        
        original = Image.open(original_path)
        padded = Image.open(padded_path)
        
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))
        
        ax1.imshow(original)
        ax1.set_title('Original (fills canvas)', fontsize=14, fontweight='bold')
        ax1.axis('off')
        
        # Add grid to show safe zone on original
        width, height = original.size
        padding = int(width * 0.085)
        rect = plt.Rectangle((padding, padding), width - 2*padding, height - 2*padding,
                            fill=False, edgecolor='red', linewidth=3, linestyle='--')
        ax1.add_patch(rect)
        ax1.text(width/2, padding - 20, 'Safe Zone', 
                ha='center', color='red', fontweight='bold', fontsize=12)
        
        ax2.imshow(padded)
        ax2.set_title('With macOS Padding', fontsize=14, fontweight='bold')
        ax2.axis('off')
        
        plt.tight_layout()
        plt.savefig('icon_comparison.png', dpi=150, bbox_inches='tight')
        print(f"\n📊 Comparison saved to: icon_comparison.png")
        plt.show()
    except ImportError:
        print("\n💡 Install matplotlib to see visual comparison: pip install matplotlib")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python macos_icon_padding.py <input_icon.png> [output_icon.png] [padding_percent]")
        print("\nExample:")
        print("  python macos_icon_padding.py icon_original.png icon_padded.png 8.5")
        print("\nDefault padding: 8.5% (recommended for macOS Big Sur+)")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else 'icon_padded.png'
    padding = float(sys.argv[3]) if len(sys.argv) > 3 else 8.5
    
    print("=" * 60)
    print("🍎 macOS Icon Padding Tool")
    print("=" * 60)
    
    result = add_macos_padding(input_path, output_path, padding)
    
    # Ask if user wants to see comparison
    try:
        show_preview = input("\n📊 Show visual comparison? (y/n): ").lower().strip() == 'y'
        if show_preview:
            preview_comparison(input_path, output_path)
    except:
        pass
    
    print("\n" + "=" * 60)
    print("🎯 Next steps:")
    print("=" * 60)
    print(f"1. Review {output_path} to ensure it looks good")
    print(f"2. Use this padded version to generate your .icns:")
    print(f"   python icon_generator.py {output_path}")
    print(f"3. Rebuild your app: npm run make -- --platform=darwin")
