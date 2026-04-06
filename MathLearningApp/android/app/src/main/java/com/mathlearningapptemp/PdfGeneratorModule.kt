package com.mathlearningapptemp

import android.graphics.Color
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import android.text.TextPaint
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File
import java.io.FileOutputStream

/**
 * Native PDF generator module using Android's built-in PdfDocument.
 * Handles Chinese text natively via Android's text rendering engine.
 */
class PdfGeneratorModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "PdfGenerator"

    @ReactMethod
    fun generatePdf(options: ReadableMap, promise: Promise) {
        val title = options.getString("title") ?: "数学练习题"
        val date = options.getString("date") ?: ""
        val difficulty = options.getString("difficulty") ?: ""
        val questions = options.getArray("questions")
        val cacheDir = reactApplicationContext.cacheDir

        CoroutineScope(Dispatchers.IO).launch {
            try {
                if (questions == null || questions.size() == 0) {
                    promise.reject("EMPTY_QUESTIONS", "题目列表为空")
                    return@launch
                }

                // A4 size in points (595 x 842)
                val pageWidth = 595
                val pageHeight = 842
                val margin = 50
                val contentWidth = pageWidth - 2 * margin

                val document = PdfDocument()
                var pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, 1).create()
                var page = document.startPage(pageInfo)
                var canvas = page.canvas

                val titlePaint = TextPaint().apply {
                    textSize = 24f
                    color = Color.BLACK
                    isAntiAlias = true
                    textAlign = Paint.Align.CENTER
                }

                val metaPaint = TextPaint().apply {
                    textSize = 12f
                    color = Color.DKGRAY
                    isAntiAlias = true
                    textAlign = Paint.Align.LEFT
                }

                val questionPaint = TextPaint().apply {
                    textSize = 14f
                    color = Color.BLACK
                    isAntiAlias = true
                    textAlign = Paint.Align.LEFT
                }

                var yPosition = margin.toFloat()

                // Draw title (centered)
                canvas.drawText(title, (pageWidth / 2).toFloat(), yPosition + 24f, titlePaint)
                yPosition += 60f

                // Draw metadata
                if (date.isNotEmpty()) {
                    canvas.drawText("日期: $date", margin.toFloat(), yPosition, metaPaint)
                    yPosition += 20f
                }
                if (difficulty.isNotEmpty()) {
                    canvas.drawText("难度: $difficulty", margin.toFloat(), yPosition, metaPaint)
                    yPosition += 20f
                }
                yPosition += 20f

                // Draw questions
                for (i in 0 until questions.size()) {
                    val q = questions.getMap(i)
                    val content = q.getString("content") ?: ""
                    val questionText = "${i + 1}. $content"

                    // Measure text and handle wrapping
                    val lines = wrapText(questionPaint, questionText, contentWidth.toFloat())
                    val lineHeight = 14f * 1.4f
                    val blockHeight = lines.size * lineHeight + 30f

                    // Check if we need a new page
                    if (yPosition + blockHeight > pageHeight - margin) {
                        document.finishPage(page)
                        pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, document.pages.size + 1).create()
                        page = document.startPage(pageInfo)
                        canvas = page.canvas
                        yPosition = margin.toFloat()
                    }

                    // Draw each line
                    for ((lineIndex, line) in lines.withIndex()) {
                        canvas.drawText(line, margin.toFloat(), yPosition, questionPaint)
                        yPosition += lineHeight
                    }
                    yPosition += 30f // spacing between questions
                }

                document.finishPage(page)
                val pageCount = document.pages.size

                // Save to temp file
                val tempDir = File(cacheDir, "pdf_temp")
                if (!tempDir.exists()) {
                    tempDir.mkdirs()
                }
                val tempFile = File(tempDir, "questions_${System.currentTimeMillis()}.pdf")
                val fos = FileOutputStream(tempFile)
                document.writeTo(fos)
                fos.close()
                document.close()

                Log.d("PdfGenerator", "PDF generated: ${tempFile.absolutePath}, size: ${tempFile.length()}")

                val result = Arguments.createMap().apply {
                    putString("path", tempFile.absolutePath)
                    putInt("size", tempFile.length().toInt())
                    putInt("pageCount", pageCount)
                }
                promise.resolve(result)

            } catch (e: Exception) {
                Log.e("PdfGenerator", "Failed to generate PDF", e)
                promise.reject("PDF_ERROR", "生成PDF失败: ${e.message}", e)
            }
        }
    }

    /**
     * Wrap text to fit within maxWidth, handling CJK characters.
     */
    private fun wrapText(paint: TextPaint, text: String, maxWidth: Float): List<String> {
        val lines = mutableListOf<String>()
        var currentLine = ""

        for (char in text) {
            val testLine = currentLine + char
            val width = paint.measureText(testLine)
            if (width > maxWidth && currentLine.isNotEmpty()) {
                lines.add(currentLine)
                currentLine = char.toString()
            } else {
                currentLine = testLine
            }
        }
        if (currentLine.isNotEmpty()) {
            lines.add(currentLine)
        }
        return lines
    }
}
