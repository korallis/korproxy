const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.default = async function(configuration) {
  const filePath = configuration.path;
  
  // Skip if credentials not set
  if (!process.env.ES_USERNAME || !process.env.ES_PASSWORD || !process.env.ES_CREDENTIAL_ID || !process.env.ES_TOTP_SECRET) {
    console.log('[SSL.com] Skipping code signing - credentials not configured');
    return;
  }

  // Skip non-exe files
  if (!filePath.endsWith('.exe')) {
    console.log(`[SSL.com] Skipping non-exe file: ${filePath}`);
    return;
  }

  console.log(`[SSL.com] Signing ${path.basename(filePath)}...`);

  const codeSignToolPath = process.env.CODESIGNTOOL_PATH;
  if (!codeSignToolPath) {
    console.log('[SSL.com] CODESIGNTOOL_PATH not set, skipping');
    return;
  }

  const tempDir = path.join(path.dirname(filePath), 'signed_temp_' + Date.now());
  
  try {
    // Create temp directory
    fs.mkdirSync(tempDir, { recursive: true });

    // Build command - use cmd /c for batch file
    const args = [
      'sign',
      `-username=${process.env.ES_USERNAME}`,
      `-password=${process.env.ES_PASSWORD}`,
      `-credential_id=${process.env.ES_CREDENTIAL_ID}`,
      `-totp_secret=${process.env.ES_TOTP_SECRET}`,
      `-input_file_path=${filePath}`,
      `-output_dir_path=${tempDir}`
    ];

    const command = `cmd /c "${codeSignToolPath}" ${args.join(' ')}`;

    console.log('[SSL.com] Running CodeSignTool...');
    execSync(command, { 
      stdio: 'inherit',
      timeout: 300000 // 5 minute timeout
    });

    // Move signed file back
    const signedFile = path.join(tempDir, path.basename(filePath));
    if (fs.existsSync(signedFile)) {
      // Replace original with signed version
      fs.copyFileSync(signedFile, filePath);
      console.log(`[SSL.com] Successfully signed: ${path.basename(filePath)}`);
    } else {
      console.error('[SSL.com] Signed file not found in output directory');
    }
  } catch (error) {
    console.error('[SSL.com] Code signing failed:', error.message);
    // Don't throw - allow build to continue unsigned
  } finally {
    // Cleanup temp dir
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
};
