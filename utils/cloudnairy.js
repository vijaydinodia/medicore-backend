const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dqfhn7rw3",
  api_key: "382695276612379",
  api_secret: "3XWIpGNiRSe2K2Cs2t9-fUtPPY0",
});

exports.uploadImage = async (files, folder = "medicore/uploads") => {
  const fileArray = Array.isArray(files) ? files : [files];
  const results = [];

  for (const file of fileArray) {
    if (!file) continue;

    if (typeof file === "string") {
      const result = await cloudinary.uploader.upload(file, {
        folder,
        resource_type: "auto",
      });
      results.push(result);
      continue;
    }

    const buffer = file?.buffer || file?.data || file;
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder, resource_type: "auto" }, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        })
        .end(buffer);
    });

    results.push(result);
  }

  return results;
};
