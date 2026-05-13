const fs = require("fs");
const JSZip = require("jszip");

const zip = new JSZip();

zip.file(
  "[Content_Types].xml",
  `<?xml version="1.0" encoding="UTF-8"?>
  <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  </Types>`
);

zip.folder("_rels").file(
  ".rels",
  `<?xml version="1.0" encoding="UTF-8"?>
  <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  </Relationships>`
);

zip.folder("word").file(
  "document.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
  <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
      <w:p><w:r><w:t>Auto CaseStudy parser smoke test research artifact.</w:t></w:r></w:p>
    </w:body>
  </w:document>`
);

zip.generateAsync({ type: "nodebuffer" }).then((buffer) => {
  fs.writeFileSync("test-fixtures/sample-artifact.docx", buffer);
});
