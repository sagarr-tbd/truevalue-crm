"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  X, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Download,
  ArrowRight,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface FieldMapping {
  csvHeader: string;
  targetField: string;
}

export interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; error: string; data?: Record<string, unknown> }>;
}

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    data: Record<string, unknown>[],
    options: ImportOptions
  ) => Promise<ImportResult>;
  entityName: string;
  requiredFields: string[];
  fieldOptions: Array<{ value: string; label: string }>;
  sampleData?: Record<string, string>;
}

export interface ImportOptions {
  skipDuplicates: boolean;
  updateExisting: boolean;
  duplicateCheckField: 'email' | 'phone';
}

type Step = 'upload' | 'mapping' | 'preview' | 'importing' | 'result';

export default function ImportModal({
  isOpen,
  onClose,
  onImport,
  entityName,
  requiredFields,
  fieldOptions,
  sampleData,
}: ImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipDuplicates: true,
    updateExisting: false,
    duplicateCheckField: 'email',
  });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setStep('upload');
    setFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setFieldMappings([]);
    setResult(null);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const parseCSV = useCallback((text: string): { headers: string[]; data: Record<string, string>[] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]);
    
    // Parse data rows
    const data: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length > 0 && values.some(v => v.trim())) {
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }

    return { headers, data };
  }, []);

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    return result;
  };

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError(null);
    
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    try {
      const text = await selectedFile.text();
      const { headers, data } = parseCSV(text);
      
      if (data.length === 0) {
        setError('CSV file contains no data rows');
        return;
      }

      if (data.length > 1000) {
        setError('Maximum 1000 rows allowed per import');
        return;
      }

      setFile(selectedFile);
      setCsvHeaders(headers);
      setCsvData(data);

      // Auto-map fields based on header names
      const autoMappings: FieldMapping[] = headers.map(header => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchedField = fieldOptions.find(field => {
          const normalizedField = field.value.toLowerCase().replace(/[^a-z0-9]/g, '');
          const normalizedLabel = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normalizedField === normalizedHeader || normalizedLabel === normalizedHeader;
        });
        return {
          csvHeader: header,
          targetField: matchedField?.value || '',
        };
      });

      setFieldMappings(autoMappings);
      setStep('mapping');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    }
  }, [parseCSV, fieldOptions]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const updateMapping = useCallback((csvHeader: string, targetField: string) => {
    setFieldMappings(prev => 
      prev.map(m => m.csvHeader === csvHeader ? { ...m, targetField } : m)
    );
  }, []);

  const validateMappings = useCallback(() => {
    const mappedRequiredFields = fieldMappings
      .filter(m => requiredFields.includes(m.targetField))
      .map(m => m.targetField);
    
    const missingRequired = requiredFields.filter(f => !mappedRequiredFields.includes(f));
    
    if (missingRequired.length > 0) {
      const fieldLabels = missingRequired.map(f => 
        fieldOptions.find(o => o.value === f)?.label || f
      );
      setError(`Required fields not mapped: ${fieldLabels.join(', ')}`);
      return false;
    }
    
    setError(null);
    return true;
  }, [fieldMappings, requiredFields, fieldOptions]);

  const handleProceedToPreview = useCallback(() => {
    if (validateMappings()) {
      setStep('preview');
    }
  }, [validateMappings]);

  const transformData = useCallback((): Record<string, unknown>[] => {
    return csvData.map(row => {
      const transformed: Record<string, unknown> = {};
      fieldMappings.forEach(mapping => {
        if (mapping.targetField && row[mapping.csvHeader] !== undefined) {
          const value = row[mapping.csvHeader];
          // Convert empty strings to undefined
          transformed[mapping.targetField] = value.trim() || undefined;
        }
      });
      return transformed;
    });
  }, [csvData, fieldMappings]);

  const handleImport = useCallback(async () => {
    setStep('importing');
    setError(null);

    try {
      const transformedData = transformData();
      const importResult = await onImport(transformedData, importOptions);
      setResult(importResult);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStep('preview');
    }
  }, [transformData, onImport, importOptions]);

  const downloadSampleCSV = useCallback(() => {
    if (!sampleData) return;
    
    const headers = Object.keys(sampleData);
    const values = Object.values(sampleData);
    const csv = [headers.join(','), values.join(',')].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityName.toLowerCase()}-import-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sampleData, entityName]);

  if (!isOpen) return null;

  const previewData = csvData.slice(0, 5);
  const mappedFieldsCount = fieldMappings.filter(m => m.targetField).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50"
        onClick={step !== 'importing' ? handleClose : undefined}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-[101] w-full max-w-3xl max-h-[90vh] overflow-hidden"
      >
        <Card className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Import {entityName}</h2>
                <p className="text-sm text-muted-foreground">
                  {step === 'upload' && 'Upload a CSV file to import'}
                  {step === 'mapping' && 'Map CSV columns to fields'}
                  {step === 'preview' && 'Review data before importing'}
                  {step === 'importing' && 'Importing data...'}
                  {step === 'result' && 'Import complete'}
                </p>
              </div>
            </div>
            {step !== 'importing' && (
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 py-3 px-4 bg-muted/30 border-b">
            {(['upload', 'mapping', 'preview', 'result'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  step === s ? 'bg-primary text-primary-foreground' :
                  (['upload', 'mapping', 'preview', 'result'].indexOf(step) > i) ? 'bg-green-500 text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {(['upload', 'mapping', 'preview', 'result'].indexOf(step) > i) ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span className={`text-sm hidden sm:inline ${step === s ? 'font-medium' : 'text-muted-foreground'}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
                {i < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4">
            <AnimatePresence mode="wait">
              {/* Step 1: Upload */}
              {step === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-1">Drop your CSV file here</p>
                    <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                    <p className="text-xs text-muted-foreground">Maximum 1000 rows</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />
                  </div>

                  {sampleData && (
                    <div className="flex items-center justify-center">
                      <Button variant="outline" size="sm" onClick={downloadSampleCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Sample CSV Template
                      </Button>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 2: Field Mapping */}
              {step === 'mapping' && (
                <motion.div
                  key="mapping"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      File: <span className="font-medium text-foreground">{file?.name}</span> ({csvData.length} rows)
                    </span>
                    <span className="text-muted-foreground">
                      Mapped: <span className="font-medium text-foreground">{mappedFieldsCount}/{csvHeaders.length}</span>
                    </span>
                  </div>

                  <div className="border rounded-lg divide-y max-h-[300px] overflow-auto">
                    {fieldMappings.map((mapping) => (
                      <div key={mapping.csvHeader} className="flex items-center gap-4 p-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{mapping.csvHeader}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            Sample: {csvData[0]?.[mapping.csvHeader] || '(empty)'}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1">
                          <div className="relative">
                            <select
                              value={mapping.targetField}
                              onChange={(e) => updateMapping(mapping.csvHeader, e.target.value)}
                              className={`w-full h-9 pl-3 pr-8 text-sm border rounded-md appearance-none bg-background focus:outline-none focus:ring-2 focus:ring-primary ${
                                !mapping.targetField ? 'text-muted-foreground' : ''
                              } ${
                                requiredFields.includes(mapping.targetField) ? 'border-green-500' : ''
                              }`}
                            >
                              <option value="">-- Skip this column --</option>
                              {fieldOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label} {requiredFields.includes(option.value) ? '*' : ''}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Import Options */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium">Import Options</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={importOptions.skipDuplicates}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, skipDuplicates: e.target.checked }))}
                          className="rounded"
                        />
                        Skip duplicate records
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={importOptions.updateExisting}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, updateExisting: e.target.checked }))}
                          className="rounded"
                        />
                        Update existing records if duplicate found
                      </label>
                      <div className="flex items-center gap-2 text-sm">
                        <span>Check duplicates by:</span>
                        <select
                          value={importOptions.duplicateCheckField}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, duplicateCheckField: e.target.value as 'email' | 'phone' }))}
                          className="h-8 px-2 border rounded-md text-sm"
                        >
                          <option value="email">Email</option>
                          <option value="phone">Phone</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Preview */}
              {step === 'preview' && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-muted-foreground">
                    Preview of first {previewData.length} of {csvData.length} records to import:
                  </p>

                  <div className="border rounded-lg overflow-auto max-h-[300px]">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium">#</th>
                          {fieldMappings.filter(m => m.targetField).map((mapping) => (
                            <th key={mapping.targetField} className="text-left p-2 font-medium">
                              {fieldOptions.find(o => o.value === mapping.targetField)?.label || mapping.targetField}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {previewData.map((row, index) => (
                          <tr key={index} className="hover:bg-muted/30">
                            <td className="p-2 text-muted-foreground">{index + 1}</td>
                            {fieldMappings.filter(m => m.targetField).map((mapping) => (
                              <td key={mapping.targetField} className="p-2 truncate max-w-[150px]">
                                {row[mapping.csvHeader] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-sm">
                      <span className="font-medium">{csvData.length}</span> records will be imported
                      {importOptions.skipDuplicates && ' (duplicates will be skipped)'}
                      {importOptions.updateExisting && ' (existing records will be updated)'}
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <p className="text-sm">{error}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 4: Importing */}
              {step === 'importing' && (
                <motion.div
                  key="importing"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                  <p className="text-lg font-medium">Importing {csvData.length} records...</p>
                  <p className="text-sm text-muted-foreground">This may take a moment</p>
                </motion.div>
              )}

              {/* Step 5: Result */}
              {step === 'result' && result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Import Complete</h3>
                    <p className="text-muted-foreground">Your data has been imported successfully</p>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <p className="text-2xl font-bold">{result.total}</p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{result.created}</p>
                      <p className="text-sm text-muted-foreground">Created</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                      <p className="text-sm text-muted-foreground">Updated</p>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
                      <p className="text-sm text-muted-foreground">Skipped</p>
                    </div>
                  </div>

                  {result.errors.length > 0 && (
                    <div className="border border-red-200 rounded-lg overflow-hidden">
                      <div className="bg-red-50 px-4 py-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700">
                          {result.errors.length} errors occurred
                        </span>
                      </div>
                      <div className="max-h-[150px] overflow-auto divide-y">
                        {result.errors.slice(0, 10).map((err, index) => (
                          <div key={index} className="px-4 py-2 text-sm">
                            <span className="text-muted-foreground">Row {err.row}:</span>{' '}
                            <span className="text-red-600">{err.error}</span>
                          </div>
                        ))}
                        {result.errors.length > 10 && (
                          <div className="px-4 py-2 text-sm text-muted-foreground">
                            ... and {result.errors.length - 10} more errors
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-muted/30">
            <Button
              variant="outline"
              onClick={step === 'upload' || step === 'result' ? handleClose : () => setStep(
                step === 'mapping' ? 'upload' :
                step === 'preview' ? 'mapping' : 'upload'
              )}
              disabled={step === 'importing'}
            >
              {step === 'upload' || step === 'result' ? 'Close' : 'Back'}
            </Button>
            
            {step === 'mapping' && (
              <Button onClick={handleProceedToPreview}>
                Preview Import
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {step === 'preview' && (
              <Button onClick={handleImport}>
                Import {csvData.length} Records
              </Button>
            )}
            
            {step === 'result' && (
              <Button onClick={handleClose}>
                Done
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
