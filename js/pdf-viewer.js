// js/pdf-viewer.js

// Configuración de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const pdfDocs = {
    1: { 
        title: 'Consentimiento Informado',
        url: 'public/pdfs/Consentimiento 2.pdf', 
        doc: null, 
        currentPage: 1, 
        totalPages: 0 
    },
    2: { 
        title: 'Interrogatorio Pediátrico',
        url: 'public/pdfs/Interrogatoriopediatrico_Itzelmedina 2.pdf', 
        doc: null, 
        currentPage: 1, 
        totalPages: 0 
    }
};

let currentViewerId = null;

// Elementos del DOM del Modal
const modal = document.getElementById('pdf-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const canvas = document.getElementById('modal-pdf-canvas');
const ctx = canvas.getContext('2d');
const currentPageEl = document.getElementById('modal-current-page');
const totalPagesEl = document.getElementById('modal-total-pages');
const prevBtn = document.getElementById('modal-prev-page');
const nextBtn = document.getElementById('modal-next-page');
const downloadBtn = document.getElementById('modal-download-btn');

async function openPdfModal(id) {
    currentViewerId = id;
    const config = pdfDocs[id];
    
    // Configurar UI inicial del Modal
    modalTitle.textContent = config.title;
    downloadBtn.href = config.url;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Evitar scroll de fondo

    // Cargar y renderizar PDF si no se ha cargado antes
    if (!config.doc) {
        try {
            const loadingTask = pdfjsLib.getDocument(config.url);
            config.doc = await loadingTask.promise;
            config.totalPages = config.doc.numPages;
        } catch (error) {
            console.error('Error al cargar el PDF:', error);
            alert('No se pudo cargar el documento. Por favor, intente de nuevo más tarde.');
            closePdfModal();
            return;
        }
    }

    totalPagesEl.textContent = config.totalPages;
    
    // Resetear scroll al abrir
    modalBody.scrollTop = 0;
    
    renderPage();
}

function closePdfModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = ''; // Restaurar scroll
    currentViewerId = null;
    
    // Limpiar canvas para la próxima vez
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

async function renderPage() {
    const config = pdfDocs[currentViewerId];
    if (!config || !config.doc) return;

    const page = await config.doc.getPage(config.currentPage);
    
    // Ajustar escala según el ancho del modal-body
    // Usamos el ancho del body para que el PDF se vea lo más grande posible sin salirse horizontalmente
    const padding = window.innerWidth < 768 ? 20 : 80;
    const containerWidth = modalBody.clientWidth - padding;
    
    const viewport = page.getViewport({ scale: 1 });
    const scale = containerWidth / viewport.width;
    const scaledViewport = page.getViewport({ scale: scale });

    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;

    const renderContext = {
        canvasContext: ctx,
        viewport: scaledViewport
    };

    try {
        await page.render(renderContext).promise;
    } catch (error) {
        console.error('Error al renderizar la página:', error);
    }

    // Actualizar UI de navegación
    currentPageEl.textContent = config.currentPage;
    prevBtn.disabled = config.currentPage <= 1;
    nextBtn.disabled = config.currentPage >= config.totalPages;
}

// Listeners para Navegación
prevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentViewerId && pdfDocs[currentViewerId].currentPage > 1) {
        pdfDocs[currentViewerId].currentPage--;
        modalBody.scrollTop = 0; // Subir al inicio al cambiar de página
        renderPage();
    }
});

nextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentViewerId && pdfDocs[currentViewerId].currentPage < pdfDocs[currentViewerId].totalPages) {
        pdfDocs[currentViewerId].currentPage++;
        modalBody.scrollTop = 0; // Subir al inicio al cambiar de página
        renderPage();
    }
});

// Cerrar con la tecla Escape
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closePdfModal();
    }
});

// Manejar cambio de tamaño de ventana para re-renderizar
window.addEventListener('resize', () => {
    if (currentViewerId && !modal.classList.contains('hidden')) {
        renderPage();
    }
});
