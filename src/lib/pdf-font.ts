import { jsPDF } from "jspdf"

export async function loadChineseFont(doc: jsPDF): Promise<string> {
    const fontName = "NotoSansSC";

    // Check if added (simplified check, usually we track this in state or rely on try/catch if addFont throws on duplicate, but addFont is safe usually)
    // jsPDF doesn't have a simple hasFont method exposed easily, but we can manage it.
    // For now, we will just try to fetch and add. Use a global promise or something to prevent double fetch if needed, 
    // but for this button click scneario, it's fine.

    // Check VFS
    if (doc.existsFileInVFS("NotoSansSC-Regular.ttf")) {
        return fontName;
    }

    try {
        // Using a CDN that serves the TTF. 
        // Note: GitHack or JSDelivr might be faster or more reliable. 
        // Using raw.githubusercontent.com
        const url = "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC-Regular.ttf";
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to download font");

        const buffer = await response.arrayBuffer();
        const base64 = arrayBufferToBase64(buffer);

        doc.addFileToVFS("NotoSansSC-Regular.ttf", base64);
        doc.addFont("NotoSansSC-Regular.ttf", fontName, "normal");

        return fontName;
    } catch (error) {
        console.error("Font load failed", error);
        alert("Chinese font download failed. PDF text may be garbled. Please try Word export.");
        return "helvetica";
    }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}
