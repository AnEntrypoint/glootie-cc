import * as _napi_rs_canvas from '@napi-rs/canvas';
import { Canvas, CanvasRenderingContext2D } from '@napi-rs/canvas';
import { DocumentInitParameters, PDFDocumentProxy } from './types/src/display/api';
import * as pdfjs_dist_types_src_display_metadata from './types/src/display/metadata';
import * as PDFJS from './types/src/pdf';

interface CanvasFactoryContext {
    canvas?: HTMLCanvasElement | Canvas;
    context?: CanvasRenderingContext2D | CanvasRenderingContext2D;
}
/**
 * Derived from the PDF.js project by the Mozilla Foundation.
 * @see https://github.com/mozilla/pdf.js/blob/b8de9a372f9bbf7e33adb362eeae5ef1919dba73/src/display/canvas_factory.js#L18
 * @license Apache-2.0
 */
declare class BaseCanvasFactory {
    #private;
    constructor({ enableHWA }?: {
        enableHWA?: boolean | undefined;
    });
    create(width: number, height: number): {
        canvas: Canvas | HTMLCanvasElement;
        context: _napi_rs_canvas.SKRSContext2D | globalThis.CanvasRenderingContext2D | null;
    };
    reset({ canvas }: CanvasFactoryContext, width: number, height: number): void;
    destroy(context: CanvasFactoryContext): void;
    _createCanvas(width: number, height: number): HTMLCanvasElement | Canvas;
}
/**
 * Derived from the PDF.js project by the Mozilla Foundation.
 * @see https://github.com/mozilla/pdf.js/blob/b8de9a372f9bbf7e33adb362eeae5ef1919dba73/src/display/canvas_factory.js#L18
 * @license Apache-2.0
 */
declare class DOMCanvasFactory extends BaseCanvasFactory {
    _document: Document;
    constructor({ ownerDocument, enableHWA }?: {
        ownerDocument?: Document | undefined;
        enableHWA?: boolean | undefined;
    });
    _createCanvas(width: number, height: number): HTMLCanvasElement;
}
declare class NodeCanvasFactory extends BaseCanvasFactory {
    constructor({ enableHWA }?: {
        enableHWA?: boolean | undefined;
    });
    _createCanvas(width: number, height: number): Canvas;
}

interface ExtractedImageObject {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    channels: 1 | 3 | 4;
    key: string;
}
/**
 * Extracts images from a specific page of a PDF document, including necessary metadata,
 * such as width, height, and calculated color channels.
 *
 * @example
 * const imagesData = await extractImages(pdf, pageNum)
 *
 * for (const imgData of imagesData) {
 *   const imageIndex = totalImagesProcessed + 1
 *   await sharp(imgData.data, {
 *     raw: { width: imgData.width, height: imgData.height, channels: imgData.channels }
 *   })
 *     .png()
 *     .toFile(`${imageIndex}.png`)
 * }
 */
declare function extractImages$1(data: DocumentInitParameters['data'] | PDFDocumentProxy, pageNumber: number): Promise<ExtractedImageObject[]>;
declare function renderPageAsImage$1(data: DocumentInitParameters['data'] | PDFDocumentProxy, pageNumber: number, options?: {
    canvasImport?: () => Promise<typeof _napi_rs_canvas>;
    /** @default 1.0 */
    scale?: number;
    width?: number;
    height?: number;
    toDataURL?: false;
}): Promise<ArrayBuffer>;
declare function renderPageAsImage$1(data: DocumentInitParameters['data'] | PDFDocumentProxy, pageNumber: number, options: {
    canvasImport?: () => Promise<typeof _napi_rs_canvas>;
    /** @default 1.0 */
    scale?: number;
    width?: number;
    height?: number;
    toDataURL: true;
}): Promise<string>;
declare function createIsomorphicCanvasFactory(canvasImport?: () => Promise<typeof _napi_rs_canvas>): Promise<typeof DOMCanvasFactory | typeof NodeCanvasFactory>;

declare function extractLinks$1(data: DocumentInitParameters['data'] | PDFDocumentProxy): Promise<{
    totalPages: number;
    links: string[];
}>;

declare function getMeta$1(data: DocumentInitParameters['data'] | PDFDocumentProxy, options?: {
    parseDates?: boolean;
}): Promise<{
    info: Record<string, any>;
    metadata: pdfjs_dist_types_src_display_metadata.Metadata;
}>;

declare function extractText$1(data: DocumentInitParameters['data'] | PDFDocumentProxy, options?: {
    mergePages?: false;
}): Promise<{
    totalPages: number;
    text: string[];
}>;
declare function extractText$1(data: DocumentInitParameters['data'] | PDFDocumentProxy, options: {
    mergePages: true;
}): Promise<{
    totalPages: number;
    text: string;
}>;

/**
 * By default, unpdf will use the latest version of PDF.js compiled for
 * serverless environments. If you want to use a different version, you can
 * provide a custom resolver function.
 *
 * @example
 * // Use the official PDF.js build (make sure to install it first)
 * import { definePDFJSModule } from 'unpdf'
 *
 * await definePDFJSModule(() => import('pdfjs-dist'))
 */
declare function definePDFJSModule(pdfjs: () => Promise<any>): Promise<void>;
/** @deprecated Use `definePDFJSModule` instead. */
declare function configureUnPDF(options: {
    pdfjs?: () => Promise<any>;
}): Promise<void>;

/**
 * Returns a PDFDocumentProxy instance from a given binary data.
 *
 * Applies the following defaults:
 * - `isEvalSupported: false`
 * - `useSystemFonts: true`
 */
declare function getDocumentProxy(data: DocumentInitParameters['data'], options?: DocumentInitParameters): Promise<PDFDocumentProxy>;
declare function getResolvedPDFJS(): Promise<typeof PDFJS>;
declare function resolvePDFJSImport(pdfjsResolver?: () => Promise<any>, { reload }?: {
    reload?: boolean | undefined;
}): Promise<void>;

declare const getMeta: typeof getMeta$1;
declare const extractText: typeof extractText$1;
declare const extractImages: typeof extractImages$1;
declare const renderPageAsImage: typeof renderPageAsImage$1;
declare const extractLinks: typeof extractLinks$1;

export { configureUnPDF, createIsomorphicCanvasFactory, definePDFJSModule, extractImages, extractLinks, extractText, getDocumentProxy, getMeta, getResolvedPDFJS, renderPageAsImage, resolvePDFJSImport };
