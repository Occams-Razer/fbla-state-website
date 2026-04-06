import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // 1. Requirement: Validation
    if (!file) {
      console.log("[UPLOAD] Rejecting request: No file attached.");
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    // 2. Requirement: Performance Optimization (Limit to 5MB for fast loading)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; 
    if (file.size > MAX_FILE_SIZE) {
      console.log(`[UPLOAD] Rejecting ${file.name}: File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 5MB limit.`);
      return NextResponse.json({ error: "File size must be under 5MB" }, { status: 400 });
    }

    console.log(`[SERVER] Processing upload for: ${file.name}`);

    // 3. Convert the file to a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 4. Create a unique filename to prevent overwriting
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    
    // 5. Define the save path (public/uploads)
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    // 6. Save the file to the local server folder
    await writeFile(filePath, buffer);
    
    console.log(`[SUCCESS] Image saved locally at: /uploads/${filename}`);

    // 7. Return the URL path for the database and frontend
    return NextResponse.json({ url: `/uploads/${filename}` });

  } catch (error) {
    console.error("[ERROR] Image upload failed:", error);
    return NextResponse.json({ error: "Error saving image" }, { status: 500 });
  }
}