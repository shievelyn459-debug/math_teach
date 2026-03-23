# Story 4.3: download-print-pdf

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a parent user,
I want to download and print the exported PDF file or share it with other apps,
so that I can easily access the practice worksheets on my device or print them for my child.

## Acceptance Criteria

1. [ ] User can download the saved PDF to device storage
2. [ ] User can open the PDF directly from the app
3. [ ] User can share the PDF with other apps (email, messaging, cloud storage)
4. [ ] User can print the PDF directly from the app (iOS AirPrint/Android Print Service)
5. [ ] Download/Share actions are accessible from PDF preview and success screen
6. [ ] Share action shows a native share sheet with available apps
7. [ ] Print action opens native print dialog with PDF pre-loaded
8. [ ] All actions complete within 3 seconds (excluding user interaction)
9. [ ] Error handling with clear messages for permission/network failures
10. [ ] User can view saved PDFs in a "My PDFs" list within the app

## Tasks / Subtasks

- [ ] Add sharing functionality (AC: 3, 6)
  - [ ] Install react-native-share package
  - [ ] Implement sharePDF(filePath: string) function in pdfService
  - [ ] Add native share sheet with app suggestions
  - [ ] Handle sharing to email, messaging, cloud storage
  - [ ] Add share icon/button to PDF preview screen
  - [ ] Add share option to success screen

- [ ] Add printing functionality (AC: 4, 7)
  - [ ] Install expo-print package (or react-native-print)
  - [ ] Implement printPDF(filePath: string) function in pdfService
  - [ ] Open native print dialog (AirPrint for iOS, Print Service for Android)
  - [ ] Pre-load PDF in print dialog
  - [ ] Add print icon/button to PDF preview screen
  - [ ] Add print option to success screen

- [ ] Implement "Open File" action (AC: 2)
  - [ ] Use React Native Linking API or native file viewer
  - [ ] Open PDF with default system viewer
  - [ ] Handle cases where no PDF viewer is installed
  - [ ] Add "Open" button to success screen

- [ ] Add download confirmation and file info (AC: 1)
  - [ ] Display file path after save
  - [ ] Show file size information
  - [ ] Add "View in Files" option (platform-specific file manager)
  - [ ] Confirm save location

- [ ] Create "My PDFs" list screen (AC: 10)
  - [ ] Create PDFListScreen component
  - [ ] Scan Documents/Downloads directory for PDF files
  - [ ] Display PDFs in list with filename, date, size
  - [ ] Add thumbnail preview (optional)
  - [ ] Allow opening, sharing, deleting from list
  - [ ] Add empty state with helpful message
  - [ ] Add "My PDFs" entry point in navigation

- [ ] Add success screen improvements (AC: 5, 6, 7)
  - [ ] Modify PDFPreviewScreen success state
  - [ ] Add action buttons: Share, Print, Open, View All
  - [ ] Show file info (name, size, location)
  - [ ] Add "Done" button to return to questions list
  - [ ] Add "Generate More" button

- [ ] Add error handling and retry (AC: 9)
  - [ ] Catch share errors (no compatible apps, permissions)
  - [ ] Catch print errors (no printer, service unavailable)
  - [ ] Catch file open errors (no viewer app)
  - [ ] Display user-friendly error messages
  - [ ] Add "Try Again" or "Cancel" options
  - [ ] Log errors for monitoring

- [ ] Handle permissions properly (AC: 1, 3, 4)
  - [ ] Check and request storage permissions (Android)
  - [ ] Check and request print permissions
  - [ ] Handle permission denials gracefully
  - [ ] Provide helpful messages for permissions
  - [ ] Link to app settings for permanent permission grants

- [ ] Add comprehensive tests (All ACs)
  - [ ] Tests for share functionality
  - [ ] Tests for print functionality
  - [ ] Tests for file opening
  - [ ] Tests for PDF list scanning and display
  - [ ] Tests for permission handling
  - [ ] Integration tests for all actions
  - [ ] Performance tests (<3s requirement)

## Dev Notes

### Relevant Architecture Patterns and Constraints

- **Service Layer**: Extend pdfService from Story 4-2 with share/print/open methods
- **Component Pattern**: Action buttons, success screen enhancements
- **State Management**: React hooks for action states
- **Performance**: Actions must respond in <3 seconds (excluding user interaction)
- **Permissions**: Handle storage and print permissions properly
- **Native Integration**: Use native share sheets and print dialogs
- **New Libraries Required**: react-native-share, expo-print (or react-native-print)
- **Existing Libraries**: react-native-fs for file operations

### Source Tree Components to Touch

- **MathLearningApp/src/services/pdfService.ts** (extend from Story 4-2)
  - sharePDF(filePath: string, options?: ShareOptions)
  - printPDF(filePath: string, printerOptions?: PrintOptions)
  - openPDF(filePath: string)
  - getSavedPDFs(): Promise<PDFFileInfo[]>
  - deletePDF(filePath: string)
  - checkPermissions(): Promise<PermissionStatus>
  - requestPermissions(): Promise<boolean>

- **MathLearningApp/src/screens/PDFPreviewScreen.tsx** (modify from Story 4-2)
  - Add action buttons: Share, Print, Open
  - Add success screen state with file info
  - Handle action button presses
  - Show loading states for actions
  - Add error handling for each action

- **MathLearningApp/src/screens/PDFListScreen.tsx** (new)
  - Display list of saved PDFs
  - Scan Documents/Downloads for PDF files
  - Show file info (name, date, size)
  - Actions: Open, Share, Delete
  - Empty state handling
  - Pull to refresh
  - Search/filter (optional)

- **MathLearningApp/src/components/PDFActionButtons.tsx** (new)
  - Reusable action button group
  - Share, Print, Open, View All buttons
  - Loading states for each button
  - Consistent styling

- **MathLearningApp/src/components/PDFListItem.tsx** (new)
  - Display PDF file info
  - Thumbnail preview (optional)
  - Action buttons (Open, Share, Delete)
  - Swipe gestures for actions

- **MathLearningApp/App.tsx** (modify)
  - Add "My PDFs" to navigation/tab bar
  - Add PDFListScreen to navigation stack

- **MathLearningApp/src/types/index.ts** (extend from Story 4-2)
  - Add PDFFileInfo interface
  - Add ShareOptions interface
  - Add PrintOptions interface
  - Add PermissionStatus interface

### Testing Standards Summary

- Tests for share functionality (mock react-native-share)
- Tests for print functionality (mock expo-print)
- Tests for file opening (mock Linking)
- Tests for PDF list scanning
- Tests for permission requests
- Tests for error handling
- Integration tests for complete flows
- Performance tests (<3s requirement)

### Project Structure Notes

- **Third story in Epic 4** - depends on Stories 4-1 and 4-2
- **Builds on Story 4-2**: Uses saved PDF from export workflow
- **Follows established patterns**:
  - Service extension pattern (add methods to pdfService)
  - Screen navigation pattern
  - Action button pattern
  - Error handling pattern

- **New patterns for Epic 4**:
  - Native share sheet integration
  - Native print dialog integration
  - File scanning and listing
  - Multi-action success screen

### Previous Story Intelligence

**From Story 4-2 (export-questions-to-pdf):**
- **pdfService**: Created with generateQuestionsPDF and savePDF methods
- **PDFPreviewScreen**: Created with preview, filename dialog, save functionality
- **PDF Metadata**: PDFMetadata interface with title, date, difficulty, filename
- **File Save Logic**: PDF saved to platform-specific directories (Documents/Downloads)
- **Success Message**: Shows file path after save
- **Error Handling**: Pattern for user-friendly error messages with retry

**Key Code Patterns to Reuse:**

1. **Service Extension** (extending pdfService):
```typescript
export const pdfService = {
  // Existing methods from Story 4-2
  async generateQuestionsPDF(...): Promise<string> { ... },
  async savePDF(...): Promise<string> { ... },

  // New methods for Story 4-3
  async sharePDF(filePath: string, options?: ShareOptions): Promise<void> {
    const shareOptions = {
      title: '分享练习题',
      message: '一年级数学练习题',
      url: `file://${filePath}`,
      type: 'application/pdf',
      ...options
    };
    await Share.open(shareOptions);
  },

  async printPDF(filePath: string): Promise<void> {
    await Print.printAsync({ uri: `file://${filePath}` });
  },

  async openPDF(filePath: string): Promise<boolean> {
    try {
      await Linking.openURL(`file://${filePath}`);
      return true;
    } catch {
      return false;
    }
  }
};
```

2. **Action Button Pattern** (from other screens):
```typescript
const PDFActionButtons: React.FC<{
  onShare: () => void;
  onPrint: () => void;
  onOpen: () => void;
  sharing?: boolean;
  printing?: boolean;
  opening?: boolean;
}> = ({ onShare, onPrint, onOpen, sharing, printing, opening }) => {
  return (
    <View style={styles.buttonContainer}>
      <Button
        icon="share"
        onPress={onShare}
        loading={sharing}
        disabled={sharing}
      >
        分享
      </Button>
      <Button
        icon="print"
        onPress={onPrint}
        loading={printing}
        disabled={printing}
      >
        打印
      </Button>
      <Button
        icon="file-open"
        onPress={onOpen}
        loading={opening}
        disabled={opening}
      >
        打开
      </Button>
    </View>
  );
};
```

3. **Success Screen Enhancement** (from PDFPreviewScreen):
```typescript
const [showSuccess, setShowSuccess] = useState(false);
const [savedFilePath, setSavedFilePath] = useState<string>('');

const handleSaveSuccess = (path: string) => {
  setSavedFilePath(path);
  setShowSuccess(true);
};

// Success screen with action buttons
{showSuccess && (
  <View style={styles.successContainer}>
    <Icon name="check-circle" size={64} color="#4CAF50" />
    <Text style={styles.successTitle}>PDF已保存</Text>
    <Text style={styles.filePath}>{savedFilePath}</Text>
    <PDFActionButtons
      onShare={handleShare}
      onPrint={handlePrint}
      onOpen={handleOpen}
      sharing={sharing}
      printing={printing}
      opening={opening}
    />
    <Button onPress={handleDone}>完成</Button>
    <Button onPress={handleGenerateMore}>生成更多</Button>
  </View>
)}
```

4. **Error Handling** (from Story 4-2):
```typescript
const [actionError, setActionError] = useState<string | null>(null);

const handleShare = async () => {
  setActionError(null);
  try {
    await pdfService.sharePDF(savedFilePath);
  } catch (error) {
    setActionError(getErrorMessage(error));
  }
};

// Error display
{actionError && (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>{actionError}</Text>
    <Button onPress={handleRetry}>重试</Button>
    <Button onPress={handleCancel}>取消</Button>
  </View>
)}
```

**Key Learnings from Stories 4-1 and 4-2:**
1. Show clear loading states for async operations
2. Provide immediate user feedback
3. Handle platform-specific differences (iOS vs Android)
4. Test permission handling thoroughly
5. Provide helpful error messages
6. Make actions reversible or cancelable when possible
7. Consider user's next actions (what do they want to do after X?)

### Git Intelligence Summary

Recent commits show:
- Service extension pattern continues
- Native API integration (Linking, permissions)
- Platform-specific code patterns
- Multi-action UI components

### Latest Tech Information

**react-native-share v8+ - Native Share Sheet:**

```typescript
import Share from 'react-native-share';

// Basic share
const sharePDF = async (filePath: string) => {
  try {
    await Share.open({
      title: '分享练习题',
      message: '一年级数学练习题',
      url: `file://${filePath}`,
      type: 'application/pdf',
      subject: '数学练习题', // for email
    });
  } catch (error) {
    // User cancelled or error occurred
    if (error.message !== 'User did not share') {
      console.error('Share error:', error);
    }
  }
};

// Share to specific apps
const shareToEmail = async (filePath: string) => {
  await Share.open({
    url: `file://${filePath}`,
    type: 'application/pdf',
    email: 'parent@example.com',
    subject: '数学练习题',
    message: '请查收孩子的数学练习题',
  });
};

// Social share (if applicable)
const shareSocial = async (filePath: string, message: string) => {
  await Share.shareSingle({
    social: Share.Social.WHATSAPP, // or other platforms
    url: `file://${filePath}`,
    message: message,
  });
};
```

**expo-print - Native Print Dialog:**

```typescript
import * as Print from 'expo-print';

const printPDF = async (filePath: string) => {
  try {
    // Check if printing is available
    const isAvailable = await Print.printAvailableAsync();
    if (!isAvailable) {
      throw new Error('打印服务不可用');
    }

    // Open print dialog
    await Print.printAsync({
      uri: `file://${filePath}`,
    });

    // Optionally, print with HTML
    // const html = generateHTML(questions);
    // await Print.printAsync({ html });

  } catch (error) {
    console.error('Print error:', error);
    throw error;
  }
};
```

**React Native Linking API - Open Files:**

```typescript
import {Linking} from 'react-native';

const openPDF = async (filePath: string): Promise<boolean> => {
  try {
    const url = `file://${filePath}`;
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      throw new Error('没有安装PDF查看器');
    }

    await Linking.openURL(url);
    return true;
  } catch (error) {
    console.error('Open file error:', error);
    return false;
  }
};
```

**File Scanning for PDF List:**

```typescript
import RNFS from 'react-native-fs';

const getSavedPDFs = async (): Promise<PDFFileInfo[]> => {
  // Platform-specific directories
  const searchDirs = Platform.select({
    ios: [RNFS.DocumentDirectoryPath],
    android: [
      RNFS.ExternalStorageDirectoryPath + '/Documents',
      RNFS.DownloadDirectoryPath,
    ],
  });

  const pdfFiles: PDFFileInfo[] = [];

  for (const dir of searchDirs || []) {
    try {
      const files = await RNFS.readDir(dir);
      const pdfs = files
        .filter(f => f.name.endsWith('.pdf') && !f.name.startsWith('.'))
        .map(f => ({
          name: f.name,
          path: f.path,
          size: f.size,
          createdAt: new Date(f.ctime || 0),
          modifiedAt: new Date(f.mtime || 0),
        }));
      pdfFiles.push(...pdfs);
    } catch (error) {
      // Directory doesn't exist or can't be read
      console.warn(`Cannot read directory: ${dir}`);
    }
  }

  // Sort by modified date, newest first
  return pdfFiles.sort((a, b) =>
    b.modifiedAt.getTime() - a.modifiedAt.getTime()
  );
};
```

**Permission Handling:**

```typescript
import {Platform, PermissionsAndroid, Linking} from 'react-native';

const checkPermissions = async (): Promise<PermissionStatus> => {
  if (Platform.OS === 'android') {
    const storage = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
    );
    const write = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    );
    return {
      storage,
      write,
      allGranted: storage && write,
    };
  }
  // iOS doesn't need explicit storage permission for app Documents
  return {
    storage: true,
    write: true,
    allGranted: true,
  };
};

const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ]);

      const allGranted =
        granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] ===
          PermissionsAndroid.RESULTS.GRANTED;

      return allGranted;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }
  return true; // iOS
};

// Open app settings for permission
const openAppSettings = () => {
  Linking.openSettings();
};
```

**Platform-Specific Considerations:**

**iOS (AirPrint):**
- Print dialog is native and handles everything
- No special permissions needed
- PDF must be accessible from app sandbox

**Android (Print Service):**
- Requires PRINT permission (auto-granted)
- May show system print dialog
- Compatible printers must be configured

**File Manager Integration:**
- iOS: Files app shows app's Documents folder
- Android: File managers can access app-specific directories
- Show full file path to help user locate files

### Integration Points

**With PDFPreviewScreen (Story 4-2):**
- Add action buttons to success screen
- Handle share, print, open actions
- Show file info and next action suggestions

**With pdfService (Story 4-2):**
- Extend with share, print, open methods
- Add file scanning for PDF list
- Maintain consistent error handling

**With Navigation:**
- Add PDFListScreen to navigation stack
- Add "My PDFs" entry point (tab bar or drawer)
- Navigate to PDF preview from list

**With React Native Share:**
- Native share sheet integration
- Platform-specific app suggestions
- Error handling for unsupported actions

**With Expo Print (or react-native-print):**
- Native print dialog integration
- AirPrint (iOS) and Print Service (Android)
- Printer discovery and selection

### UX Considerations

**Success Screen Actions:**
After PDF is saved, show user what they can do:
1. **Primary Action**: Share or Print (most common use cases)
2. **Secondary**: Open file to review
3. **Tertiary**: View all saved PDFs
4. **Navigation**: Done or Generate More

**Visual Design:**
- Large success icon with animation
- Clear file info (name, location, size)
- Prominent action buttons with icons
- Consistent button order: Share → Print → Open → View All

**Share Sheet:**
- Native share sheet (platform-appropriate)
- Suggest common apps (email, messaging, cloud storage)
- Show preview if supported by platform

**Print Dialog:**
- Native print dialog (platform-appropriate)
- PDF pre-loaded in dialog
- Printer selection (if multiple available)

**My PDFs List:**
- List view with file info
- Thumbnail preview (optional, nice-to-have)
- Swipe actions (iOS) or long-press (Android)
- Pull to refresh
- Search/filter by name or date
- Empty state: "暂无保存的PDF。生成一些练习题吧！"

**Loading States:**
- Show brief loading indicator for each action
- Timeout after 3 seconds (per AC)
- Show specific error messages

**Error Handling:**
- No PDF viewer: "请先安装PDF查看器应用"
- Share failed: "分享失败，请重试"
- Print unavailable: "打印服务不可用"
- Permission denied: "需要存储权限才能访问文件" + "前往设置" button

**Accessibility:**
- Screen reader announcements for action success/failure
- High contrast mode support
- Touch target sizes ≥ 44x44 points
- Keyboard navigation support

### References

- [Source: docs/prd.md#功能需求] FR14: 家长用户可以下载和打印生成的PDF文件
- [Source: _planning-artifacts/epics.md] US4.3: 家长用户可以下载和打印生成的PDF文件
- [Source: docs/architecture-design.md] PDF export and sharing design
- [Source: 4-2-export-questions-to-pdf.md] PDF save functionality
- [react-native-share Documentation](https://react-native-share.github.io/react-native-share/)
- [expo-print Documentation](https://docs.expo.dev/versions/latest/sdk/print/)
- [Creating and Sharing PDF in React Native using Expo - Medium](https://medium.com/@josematheusnoveli/creating-and-sharing-pdf-in-react-native-using-expo-c6d3c3cb047f)
- [Share Remote PDF file - react-native-share docs](https://react-native-share.github.io/react-native-share/docs/share-remote-file)

## Dev Agent Record

### Agent Model Used

Story context created by Bob (Scrum Master) - BMad create-story workflow

### Completion Notes List

**Story 4-3 Analysis:**

This is a **PDF download and action story** that builds on Story 4-2's PDF export to add share, print, and open functionality. This completes the core PDF workflow.

**What This Story Creates:**
- ✅ Share functionality using react-native-share
- ✅ Print functionality using expo-print
- ✅ Open file functionality using Linking API
- ✅ "My PDFs" list screen for saved files
- ✅ Enhanced success screen with action buttons
- ✅ Comprehensive permission handling

**Implementation Scope:**
Medium-to-large story (~7-9 hours):
1. Share functionality (~1.5 hours)
2. Print functionality (~1.5 hours)
3. Open file functionality (~1 hour)
4. PDF list screen (~2.5 hours)
5. Success screen enhancements (~1 hour)
6. Permission handling (~0.5 hours)
7. Tests and refinement (~1.5 hours)

**Risk Assessment: MEDIUM**
- New library dependencies (react-native-share, expo-print)
- Platform-specific print dialogs (iOS AirPrint vs Android Print Service)
- Permission handling complexity (especially Android 13+)
- Native share sheet variations between platforms
- File scanning performance (many PDFs)
- Error scenarios (no printer, no PDF viewer, share failures)

**Design Decisions:**
1. react-native-share for sharing (most mature, actively maintained)
2. expo-print for printing (official Expo solution, cross-platform)
3. Linking API for opening files (built-in, no dependencies)
4. Native share sheet (platform-appropriate experience)
5. Native print dialog (AirPrint on iOS, Print Service on Android)
6. "My PDFs" list in app (not just relying on file manager)

**Dependencies:**
- Story 4-1 must be complete (GeneratedQuestionsList, question generation)
- Story 4-2 must be complete (PDF save, PDFPreviewScreen, pdfService)
- New libraries required: react-native-share, expo-print
- No dependencies on Story 4-4

**Integration with Future Stories:**
- Story 4-4: Will optimize PDF list and preview for tablet devices

### File List

**Expected New Files:**
- `MathLearningApp/src/screens/PDFListScreen.tsx` - PDF list screen
- `MathLearningApp/src/components/PDFActionButtons.tsx` - Action button group
- `MathLearningApp/src/components/PDFListItem.tsx` - PDF list item
- `MathLearningApp/src/screens/__tests__/PDFListScreen.test.tsx`
- `MathLearningApp/src/components/__tests__/PDFActionButtons.test.tsx`
- `MathLearningApp/src/components/__tests__/PDFListItem.test.tsx`

**Expected Modified Files:**
- `MathLearningApp/src/services/pdfService.ts` - Add share, print, open, list methods
- `MathLearningApp/src/screens/PDFPreviewScreen.tsx` - Add action buttons, success screen
- `MathLearningApp/App.tsx` - Add "My PDFs" to navigation
- `MathLearningApp/src/types/index.ts` - Add PDFFileInfo, ShareOptions, PrintOptions

**Expected Package Additions:**
- `react-native-share` (latest version)
- `expo-print` (if using Expo, otherwise `react-native-print`)

---
