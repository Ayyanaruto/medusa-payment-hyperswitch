import{Container,Input,Label,Button,Switch,toast } from "@medusajs/ui";
import { useQueryClient } from "@tanstack/react-query";

import {FormField,SelectField, SpinnerPage } from "./re:components";
import React, { useMemo } from "react";

import { useProxyConfigurationForm } from "../utility-hooks";

import { useProxyConfiguration,useCreateProxyConfiguration } from "../query-hooks";

import { validateProxyConfigurationForm } from "../utils";

const ProxyConfigurationForm = ()=>{
const queryClient = useQueryClient();

const {data,isSuccess,isLoading} = useProxyConfiguration();

const {mutate:createProxyConfigurations,isLoading:isSubmitting} = useCreateProxyConfiguration();
const{
formState,
handleChange,
errors,
formSetters,
setErrors
} = useProxyConfigurationForm();

const handleSubmit = (e:React.FormEvent)=>{
e.preventDefault();
const isValid = validateProxyConfigurationForm(formState,setErrors);
if(isValid){
createProxyConfigurations(formState,{
onSuccess:()=>{
queryClient.invalidateQueries({queryKey:["proxy"]});
toast.success("Success",{
  description:"Proxy Configuration saved successfully"
});
},
onError:()=>{
toast.error("Error",{
  description:"Error saving Proxy Configuration"
});
}
});
}else{
toast.error("Error",{
  description:"Invalid Proxy Configuration"
});
}
}

useMemo(()=>{
if(isSuccess&& data?.proxy){
Object.keys(data.proxy).forEach((key) => {
  const setterName = `setProxy${key.charAt(0).toUpperCase() + key.slice(1)}`;
  if (formSetters[setterName as keyof typeof formSetters]) {
    console.log(key);
    (formSetters[setterName as keyof typeof formSetters] as (value: any) => void)(data.proxy[key]);
  }
});

}
}
,[isSuccess,data]);
if(isLoading){
return <SpinnerPage />;
}
 return (
   <Container className="grid grid-cols-5 gap-3 mt-6">
     <form className="col-span-5" onSubmit={handleSubmit}>
       <div className="col-span-1 m-5">
         <Label>Enable Proxy</Label>
         <Switch
           className="ml-3"
           checked={formState.isActive}
           onCheckedChange={(checked) => {
             handleChange.activeProxy(checked);
           }}
           name="isActive"
         />
       </div>
       <FormField label="Proxy Host" error={errors.host}>
         <Input
           placeholder="Enter your Proxy Host"
           id="proxy-host"
           name="host"
           onChange={handleChange.proxyHost}
           disabled={!formState.isActive}
           value={formState.host}
         />
       </FormField>
       <FormField label="Proxy Port" error={errors.port}>
         <Input
         type="number"
           placeholder="Enter your Proxy Port"
           id="proxy-port"
           name="port"
           onChange={handleChange.proxyPort}
           disabled={!formState.isActive}
           value={formState.port}
         />
       </FormField>
       <FormField label="Proxy Username" error={errors.username}>
         <Input
           placeholder="Enter your Proxy Username"
           id="proxy-username"
           name="username"
           onChange={handleChange.proxyUsername}
           disabled={!formState.isActive}
           value={formState.username}
         />
       </FormField>
       <FormField label="Proxy Password" error={errors.password}>
         <Input
           placeholder="Enter your Proxy Password"
           id="proxy-password"
           name="password"
           onChange={handleChange.proxyPassword}
           disabled={!formState.isActive}
           value={formState.password}
         />
       </FormField>
       <FormField label="Proxy URL" error={errors.url}>
         <Input
           placeholder="Enter your Proxy URL"
           id="proxy-url"
           name="url"
           onChange={handleChange.proxyUrl}
           disabled={!formState.isActive}
           value={formState.url}
         />
       </FormField>
       <SelectField
          label="Proxy Protocol"
          value={formState.protocol}
          onChange={handleChange.proxyProtocol}
          isEditing={formState.isActive}
          options={[
            { value: "http", label: "HTTP" },
            { value: "https", label: "HTTPS" },
          ]}
          error={errors.protocol}

          />
      <Button type="submit" className="col-span-2 my-5" disabled={isSubmitting}>
        Save
      </Button>
     </form>
   </Container>
 );
}
export default ProxyConfigurationForm;
