"""Opens the manual .docx in a running LibreOffice, fills the {{version}} and {{releaseDate}}
placeholders, updates the table of contents and fields, exports the .pdf and closes LibreOffice.
The source .docx is not modified.

LibreOffice must be started (by build.sh) with --accept=pipe,name=<pipe name>;urp;
Run it with a Python that has the LibreOffice "uno" module (the one bundled with LibreOffice,
or the system python3 with python3-uno installed):

    python export.py <pipe name> <input.docx> <output.pdf> <version> <release date>
"""

import os
import sys
import time

import uno
from com.sun.star.beans import PropertyValue
from com.sun.star.connection import NoConnectException


def props(**kwargs):
    result = []
    for name, value in kwargs.items():
        prop = PropertyValue()
        prop.Name = name
        prop.Value = value
        result.append(prop)
    return tuple(result)


def file_url(path):
    return uno.systemPathToFileUrl(os.path.abspath(path))


def connect(pipe_name):
    local_ctx = uno.getComponentContext()
    resolver = local_ctx.ServiceManager.createInstanceWithContext(
        "com.sun.star.bridge.UnoUrlResolver", local_ctx
    )
    for _ in range(120):
        try:
            return resolver.resolve(
                f"uno:pipe,name={pipe_name};urp;StarOffice.ComponentContext"
            )
        except NoConnectException:
            time.sleep(0.5)
    raise RuntimeError("Timeout connecting to LibreOffice")


def replace_all(doc, search, replace):
    descriptor = doc.createReplaceDescriptor()
    descriptor.SearchString = search
    descriptor.ReplaceString = replace
    return doc.replaceAll(descriptor)


def main():
    pipe_name, input_docx, output_pdf, version, release_date = sys.argv[1:6]
    ctx = connect(pipe_name)
    desktop = ctx.ServiceManager.createInstanceWithContext(
        "com.sun.star.frame.Desktop", ctx
    )
    try:
        doc = desktop.loadComponentFromURL(
            file_url(input_docx), "_blank", 0, props(Hidden=True)
        )
        for placeholder, value in (
            ("{{version}}", version),
            ("{{releaseDate}}", release_date),
        ):
            if replace_all(doc, placeholder, value) == 0:
                print(f"Warning: placeholder {placeholder} not found", file=sys.stderr)

        doc.getTextFields().refresh()
        indexes = doc.getDocumentIndexes()
        for i in range(indexes.getCount()):
            indexes.getByIndex(i).update()

        pdf_filter_data = uno.Any(
            "[]com.sun.star.beans.PropertyValue",
            props(
                ExportBookmarks=True,
                UseTaggedPDF=True,
                ReduceImageResolution=True,
                MaxImageResolution=200,
                Quality=80,
            ),
        )
        doc.storeToURL(
            file_url(output_pdf),
            props(FilterName="writer_pdf_Export", FilterData=pdf_filter_data),
        )
        doc.close(True)
    finally:
        try:
            desktop.terminate()
        except Exception:
            pass  # the bridge is closed when LibreOffice exits


if __name__ == "__main__":
    main()
