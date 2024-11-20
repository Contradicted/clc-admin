import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import { db } from '@/lib/db';

// Improved helper function with caching and timeout
const fileDownloadCache = new Map();
const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const DOWNLOAD_TIMEOUT = 10000; // 10 seconds timeout for each file

async function safeDownload(url) {
  if (!url || url === 'NULL' || url.toLowerCase() === 'null') {
    return null;
  }

  // Check cache first
  const cached = fileDownloadCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Failed to fetch file from ${url}: ${response.status} ${response.statusText}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const result = { 
      data: arrayBuffer,
      contentType: response.headers.get('content-type')
    };

    // Cache the result
    fileDownloadCache.set(url, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`Download timeout for ${url}`);
    } else {
      console.error(`Error downloading file from ${url}:`, error);
    }
    return null;
  }
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [url, entry] of fileDownloadCache.entries()) {
    if (now - entry.timestamp > CACHE_TIMEOUT) {
      fileDownloadCache.delete(url);
    }
  }
}, CACHE_TIMEOUT);

// Handle individual file downloads
export async function GET(request) {
  try {
    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    const fileData = await safeDownload(url);
    if (!fileData) {
      return NextResponse.json(
        { error: "Failed to fetch file" },
        { status: 404 }
      );
    }

    return new Response(fileData.data, {
      headers: {
        'Content-Type': fileData.contentType || 'application/octet-stream',
      }
    });
  } catch (error) {
    console.error("[DOWNLOAD_SINGLE_FILE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}

// Handle bulk downloads
export async function POST(request) {
  try {
    const { courseTitle, campus, commencement } = await request.json();

    const applications = await db.application.findMany({
      where: {
        courseTitle,
        campus,
        commencement,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        identificationNoUrl: true,
        immigration_url: true,
        signatureUrl: true,
        qualifications: true,
        workExperience: true,
      },
    });

    if (applications.length === 0) {
      return NextResponse.json(
        { error: 'No applications found matching the criteria' },
        { status: 404 }
      );
    }

    const zip = new JSZip();

    // Process applications in chunks to prevent memory issues
    const CHUNK_SIZE = 5;
    for (let i = 0; i < applications.length; i += CHUNK_SIZE) {
      const chunk = applications.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(async (app) => {
        const folderName = `${app.firstName.trim()} ${app.lastName.trim()}-${app.id}`;
        const appFolder = zip.folder(folderName);

        // Helper function to download and add file to zip
        const addFileToZip = async (url, fileName) => {
          if (!url || url === 'NULL' || url.toLowerCase() === 'null') return;
          
          const fileData = await safeDownload(url);
          if (fileData && fileData.data) {
            try {
              appFolder.file(fileName, fileData.data, {
                binary: true,
                createFolders: true
              });
            } catch (error) {
              console.error(`Failed to add ${fileName} to zip:`, error);
            }
          }
        };

        // Group all file downloads for parallel processing
        const downloadPromises = [];

        // Add personal files
        const personalFiles = [
          { url: app.photoUrl, name: `Profile Picture.${app.photoUrl?.split('.').pop() || 'jpg'}` },
          { url: app.identificationNoUrl, name: `Identification.${app.identificationNoUrl?.split('.').pop() || 'pdf'}` },
          { url: app.immigration_url, name: `Immigration Document.${app.immigration_url?.split('.').pop() || 'pdf'}` },
          { url: app.signatureUrl, name: 'Signature.png' }
        ].filter(file => file.url && file.url !== 'NULL' && file.url.toLowerCase() !== 'null');

        downloadPromises.push(...personalFiles.map(file => addFileToZip(file.url, file.name)));

        // Add qualification files
        if (app.qualifications?.length > 0) {
          const qualificationFiles = app.qualifications
            .filter(qual => qual.url && qual.url !== 'NULL' && qual.url.toLowerCase() !== 'null' && qual.fileName)
            .map(qual => ({ url: qual.url, name: `Qualifications/${qual.fileName}` }));
          downloadPromises.push(...qualificationFiles.map(file => addFileToZip(file.url, file.name)));
        }

        // Add work experience files
        if (app.workExperience?.length > 0) {
          const workFiles = app.workExperience
            .filter(work => work.url && work.url !== 'NULL' && work.url.toLowerCase() !== 'null' && work.fileName)
            .map(work => ({ url: work.url, name: `Work Experience/${work.fileName}` }));
          downloadPromises.push(...workFiles.map(file => addFileToZip(file.url, file.name)));
        }

        // Process all downloads in parallel
        await Promise.all(downloadPromises);
      }));
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 3 } // Lower compression level for faster processing
    });

    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename=applications_${new Date().toISOString().split('T')[0]}.zip`
      }
    });
  } catch (error) {
    console.error('[DOWNLOAD_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to process download' },
      { status: 500 }
    );
  }
}
