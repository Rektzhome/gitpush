"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, RefreshCw, DownloadCloud, FileText } from 'lucide-react';
import { getLicenseContent, updateLicenseFile, getGithubLicenseTemplates, getGithubLicenseTemplateContent } from '@/app/actions';

interface LicenseTemplate {
  key: string;
  name: string;
  spdx_id: string;
  url: string;
  node_id: string;
  html_url?: string; // Optional, but often present
  description?: string; // Optional
  body?: string; // This will be populated by getGithubLicenseTemplateContent
}

interface LicenseManagerProps {
  token: string;
  username: string;
  repoName: string;
  branchName: string; // Active branch
  defaultLicensePath?: string;
}

const replacePlaceholders = (content: string, year: string, fullname: string): string => {
  return content
    .replace(/\[year\]/gi, year)
    .replace(/\[yyyy\]/gi, year)
    .replace(/\[fullname\]/gi, fullname)
    .replace(/\[name of copyright owner\]/gi, fullname);
};

export default function LicenseManager({
  token,
  username,
  repoName,
  branchName,
  defaultLicensePath = "LICENSE",
}: LicenseManagerProps) {
  const [licenseContent, setLicenseContent] = useState<string>("");
  const [licenseSha, setLicenseSha] = useState<string | null>(null);
  const [isLoadingLicense, setIsLoadingLicense] = useState(false);
  const [isSavingLicense, setIsSavingLicense] = useState(false);
  
  const [availableLicenseTemplates, setAvailableLicenseTemplates] = useState<LicenseTemplate[]>([]);
  const [selectedLicenseTemplateKey, setSelectedLicenseTemplateKey] = useState<string>("");
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isLoadingTemplateContent, setIsLoadingTemplateContent] = useState(false);

  const [licenseEditMode, setLicenseEditMode] = useState<"template" | "custom">("custom");
  const [currentLicensePath, setCurrentLicensePath] = useState<string>(defaultLicensePath);

  const currentYear = new Date().getFullYear().toString();

  const fetchLicenseAndTemplates = useCallback(async () => {
    if (!repoName || !username || !branchName) {
        setLicenseContent("");
        setLicenseSha(null);
        setAvailableLicenseTemplates([]);
        return;
    }
    setIsLoadingLicense(true);
    setIsLoadingTemplates(true);
    
    try {
      // Fetch existing license content
      const licenseResult = await getLicenseContent(token, username, repoName, branchName, currentLicensePath);
      if (licenseResult.success) {
        setLicenseContent(licenseResult.content || "");
        setLicenseSha(licenseResult.sha || null);
        if(licenseResult.content) {
            setLicenseEditMode("custom"); // If license exists, start in custom mode to show its content
        } else {
            setLicenseEditMode("template"); // Default to template mode if no license exists
        }
      } else {
        toast.error(licenseResult.error || "Failed to fetch existing license.");
        setLicenseContent("");
        setLicenseSha(null);
      }
    } catch (error) {
      toast.error("Error fetching license data.");
      setLicenseContent("");
      setLicenseSha(null);
    } finally {
      setIsLoadingLicense(false);
    }

    try {
      // Fetch available license templates
      const templatesResult = await getGithubLicenseTemplates(token);
      if (templatesResult.success && templatesResult.templates) {
        setAvailableLicenseTemplates(templatesResult.templates);
      } else {
        toast.error(templatesResult.error || "Failed to fetch license templates.");
        setAvailableLicenseTemplates([]);
      }
    } catch (error) {
      toast.error("Error fetching license templates.");
       setAvailableLicenseTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [token, username, repoName, branchName, currentLicensePath]);

  useEffect(() => {
    fetchLicenseAndTemplates();
  }, [fetchLicenseAndTemplates]);


  const handleTemplateSelect = async (templateKey: string) => {
    setSelectedLicenseTemplateKey(templateKey);
    if (!templateKey) {
      // If "Select a template" is chosen or key is empty, clear content or revert to existing
      // For now, let's just clear if user explicitly selects an empty/default option
      // but the dropdown shouldn't really allow this if populated.
      // If the user was in template mode and wants to go custom, they'd switch mode.
      // If a valid template was selected, then "custom" was chosen, content should remain.
      // This logic might need refinement based on UX preference.
      // setLicenseContent(licenseSha ? "Previously loaded content" : ""); // Needs original content if any
      return;
    }

    setIsLoadingTemplateContent(true);
    toast.info(`Fetching template: ${templateKey}...`);
    try {
      const result = await getGithubLicenseTemplateContent(token, templateKey);
      if (result.success && result.template?.body) {
        const processedBody = replacePlaceholders(result.template.body, currentYear, username);
        setLicenseContent(processedBody);
        toast.success(`Template "${result.template.name}" loaded.`);
      } else {
        toast.error(result.error || `Failed to load template: ${templateKey}.`);
      }
    } catch (error) {
      toast.error(`Error loading template content for ${templateKey}.`);
    } finally {
      setIsLoadingTemplateContent(false);
    }
  };
  
  const handleSaveLicense = async () => {
    if (!licenseContent.trim()) {
      toast.error("License content cannot be empty.");
      return;
    }
    if (!branchName) {
        toast.error("Branch name is not specified. Cannot save license.");
        return;
    }

    setIsSavingLicense(true);
    toast.info(`${licenseSha ? 'Updating' : 'Creating'} license file: ${currentLicensePath}...`);
    try {
      const result = await updateLicenseFile(
        token,
        username,
        repoName,
        licenseContent,
        branchName,
        licenseSha,
        currentLicensePath
      );

      if (result.success && result.data?.content?.sha) {
        toast.success(`License file "${currentLicensePath}" ${licenseSha ? 'updated' : 'created'} successfully.`);
        setLicenseSha(result.data.content.sha);
        // Optionally, re-fetch license to confirm, though API provides new SHA.
        // fetchLicenseAndTemplates(); // Could cause a loop or reset user edits if not careful
      } else {
        toast.error(result.error || `Failed to ${licenseSha ? 'update' : 'create'} license file.`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred while saving the license.");
    } finally {
      setIsSavingLicense(false);
    }
  };

  const effectiveIsLoading = isLoadingLicense || isLoadingTemplates || isLoadingTemplateContent;

  if (!repoName || !username) {
    return (
      <Card>
        <CardHeader><CardTitle>License Management</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Please select a repository to manage its license.</p></CardContent>
      </Card>
    );
  }
   if (!branchName) {
    return (
      <Card>
        <CardHeader><CardTitle>License Management for {repoName}</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Please select a branch to manage its license.</p></CardContent>
      </Card>
    );
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>License Management: {repoName}</CardTitle>
        <CardDescription>
          Manage the LICENSE file for the branch: <span className="font-semibold">{branchName}</span>. 
          Path: <Input 
                    type="text" 
                    value={currentLicensePath} 
                    onChange={(e) => setCurrentLicensePath(e.target.value)} 
                    className="inline-block w-auto h-8 text-sm ml-1 px-2"
                    placeholder="e.g., LICENSE or COPYING" 
                 />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Label className="text-base font-semibold">Choose License Source</Label>
          <RadioGroup
            value={licenseEditMode}
            onValueChange={(value: "template" | "custom") => setLicenseEditMode(value)}
            className="mt-2 flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="template" id="mode-template" />
              <Label htmlFor="mode-template">Use a Template</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="custom" id="mode-custom" />
              <Label htmlFor="mode-custom">Write Custom License</Label>
            </div>
          </RadioGroup>
        </div>

        {licenseEditMode === 'template' && (
          <div className="mb-6 p-4 border rounded-md bg-slate-50">
            <Label htmlFor="license-template-select" className="text-base font-semibold block mb-2">
              Select License Template
            </Label>
            {isLoadingTemplates ? (
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> 
                    <span>Loading templates...</span>
                </div>
            ) : availableLicenseTemplates.length > 0 ? (
              <Select
                value={selectedLicenseTemplateKey}
                onValueChange={handleTemplateSelect}
                disabled={isLoadingTemplateContent}
              >
                <SelectTrigger id="license-template-select">
                  <SelectValue placeholder="Select a license template" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-[300px] overflow-y-auto">
                  {availableLicenseTemplates.map(template => (
                    <SelectItem key={template.key} value={template.key}>
                      {template.name} ({template.spdx_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
                <p className="text-sm text-muted-foreground">No license templates could be loaded. Check your connection or token permissions.</p>
            )}
             {isLoadingTemplateContent && (
                <div className="mt-2 flex items-center space-x-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading template content...</span>
                </div>
            )}
          </div>
        )}
        
        <div className="mt-4">
          <Label htmlFor="license-content-area" className="text-base font-semibold block mb-2">
            {licenseEditMode === 'template' ? "Generated License Content (Editable)" : "Custom License Content"}
          </Label>
          {isLoadingLicense && !licenseContent ? ( // Show main loader only if there's no content yet
            <div className="flex flex-col items-center justify-center h-64 border rounded-md">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              <p className="mt-3 text-muted-foreground">Loading license content...</p>
            </div>
          ) : (
            <Textarea
              id="license-content-area"
              value={licenseContent}
              onChange={(e) => {
                setLicenseContent(e.target.value);
                // If user edits content derived from a template, perhaps switch mode to custom?
                // Or allow edits directly. For now, allow direct edits.
                // if (licenseEditMode === 'template' && selectedLicenseTemplateKey) {
                //   setLicenseEditMode("custom"); // Or a third mode like "template-modified"
                // }
              }}
              placeholder="Your license text goes here. If using a template, it will appear here."
              className="min-h-[400px] font-mono text-sm"
              disabled={isSavingLicense || isLoadingTemplateContent}
            />
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <Button 
            onClick={fetchLicenseAndTemplates} 
            variant="outline" 
            disabled={effectiveIsLoading || isSavingLicense}
            title="Reload license from repository and refresh templates"
        >
          {isLoadingLicense || isLoadingTemplates ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Reload License & Templates
        </Button>
        <Button 
            onClick={handleSaveLicense} 
            disabled={effectiveIsLoading || isSavingLicense || !licenseContent.trim() || !branchName}
        >
          {isSavingLicense ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {licenseSha ? 'Update License File' : 'Create License File'}
        </Button>
      </CardFooter>
    </Card>
  );
}
