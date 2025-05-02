import React, { useState, useCallback } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, Phone, Shield } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import FileUpload from './FileUpload';
import FormHeader from './FormHeader';
import SuccessMessage from './SuccessMessage';
import { useIsMobile } from '@/hooks/use-mobile';
import { v4 as uuidv4 } from 'uuid';
import { useParams } from 'react-router-dom';

// Lista de estabelecimentos válidos
const estabelecimentosValidos = [
  'mariadocarmoalves',
  'casagradedasubaias',
  'itaoca',
  'instagram'
];

const formSchema = z.object({
  name: z.string()
    .min(3, { message: "Nome deve ter pelo menos 3 caracteres" })
    .max(100, { message: "Nome muito longo" }),
  email: z.string()
    .email({ message: "E-mail inválido" }),
  phone: z.string()
    .min(10, { message: "Telefone deve ter pelo menos 10 dígitos (com DDD)" })
    .max(15, { message: "Número de telefone muito longo" })
    .regex(/^[0-9]+$/, { message: "Telefone deve conter apenas números" }),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  complement: z.string().optional(),
  number: z.string().optional(),
  neighborhood: z.string().optional(),
  reference: z.string().optional(),
});

interface FormValues {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cnpj: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  complement: string;
  number: string;
  neighborhood: string;
  reference: string;
}

export function LeadForm() {
  console.log('Ambiente:', import.meta.env.MODE);
  console.log('Webhook URL:', import.meta.env.VITE_WEBHOOK_URL);

  const { estabelecimento } = useParams();
  const estabelecimentoValido = estabelecimento && estabelecimentosValidos.includes(estabelecimento);

  const [files, setFiles] = useState<File[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string>(uuidv4());
  const isMobile = useIsMobile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      cpf: '',
      cnpj: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      complement: '',
      number: '',
      neighborhood: '',
      reference: ''
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Validação de arquivos
      if (!files || files.length === 0) {
        setError('Por favor, faça o upload dos arquivos necessários');
        setIsSubmitting(false);
        return;
      }

      // Criar FormData para enviar os arquivos
      const formData = new FormData();

      // Adicionar os dados do formulário diretamente
      Object.entries(data).forEach(([key, value]) => {
        if (value) {
          formData.append(key, value);
        }
      });

      // Adicionar a origem do lead
      formData.append('origem', estabelecimentoValido ? estabelecimento : 'direto');
      formData.append('data_cadastro', new Date().toISOString());

      // Adicionar os arquivos ao FormData
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      // Adicionar o ID da submissão
      formData.append('submissionId', submissionId);
      formData.append('timestamp', new Date().toISOString());

      // Configurar o timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      // Obter a URL do webhook
      const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
      console.log('Webhook URL:', webhookUrl); // Log para debug

      if (!webhookUrl) {
        console.error('URL do webhook não configurada');
        throw new Error('Configuração do webhook não encontrada. Por favor, verifique as variáveis de ambiente.');
      }

      // Verificar se a URL é válida
      try {
        new URL(webhookUrl);
      } catch (e) {
        console.error('URL do webhook inválida:', webhookUrl);
        throw new Error('URL do webhook inválida. Por favor, verifique a configuração.');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Request-Type': 'form-submission'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Erro na resposta do servidor:', {
          status: response.status,
          statusText: response.statusText,
          data: errorData,
          submissionId,
          webhookUrl
        });

        if (response.status === 413) {
          throw new Error('O arquivo é muito grande. Por favor, envie um arquivo menor.');
        } else if (response.status === 429) {
          throw new Error('Muitas tentativas. Por favor, aguarde um momento e tente novamente.');
        } else {
          throw new Error(`Erro ao enviar formulário: ${response.statusText}`);
        }
      }

      // Verificar o tipo de conteúdo da resposta
      const contentType = response.headers.get('content-type');
      let result;

      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        // Se não for JSON, pegar o texto da resposta
        result = await response.text();
      }

      console.log('Resposta do servidor:', result);

      // Se a resposta for "Accepted" ou qualquer outro texto, consideramos sucesso
      if (response.ok) {
        toast.success('Formulário enviado com sucesso!');
        setIsSubmitted(true);
        form.reset();
        setFiles(null);
        setIsSubmitting(false);
      } else {
        throw new Error('Erro ao processar resposta do servidor');
      }
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          toast.error('O envio demorou muito tempo. Por favor, tente novamente.');
        } else {
          toast.error(error.message || 'Erro ao enviar formulário. Por favor, tente novamente.');
        }
      }
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    e.target.value = value;
  };

  if (isSubmitted) {
    return <SuccessMessage estabelecimento={estabelecimento} />;
  }

  return (
    <div className="animate-fade-in">
      <FormHeader />

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        <div className="space-y-3 md:space-y-4">
          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="name" className="flex items-center text-sm md:text-base">
              <User className="w-4 h-4 mr-2 text-trenergia-blue" />
              Nome Completo
            </Label>
            <Input
              id="name"
              placeholder="Digite seu nome completo"
              className="animated-input text-sm md:text-base h-9 md:h-10"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs md:text-sm text-red-500 animate-slide-up">{form.formState.errors.name.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Por favor, insira seu nome completo para que possamos personalizar sua proposta.
            </p>
          </div>

          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="email" className="flex items-center text-sm md:text-base">
              <Mail className="w-4 h-4 mr-2 text-trenergia-blue" />
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu.email@exemplo.com"
              className="animated-input text-sm md:text-base h-9 md:h-10"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-xs md:text-sm text-red-500 animate-slide-up">{form.formState.errors.email.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Informe seu melhor endereço de e-mail.
            </p>
          </div>

          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="phone" className="flex items-center text-sm md:text-base">
              <Phone className="w-4 h-4 mr-2 text-trenergia-blue" />
              Telefone com DDD
            </Label>
            <Input
              id="phone"
              placeholder="DDD + 9 + número"
              className="animated-input text-sm md:text-base h-9 md:h-10"
              {...form.register("phone")}
              onChange={handlePhoneChange}
            />
            {form.formState.errors.phone && (
              <p className="text-xs md:text-sm text-red-500 animate-slide-up">{form.formState.errors.phone.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Forneça seu número de telefone com DDD para que possamos entrar em contato, se necessário.
            </p>
          </div>

          <div className="space-y-1 md:space-y-2 pt-1 md:pt-2">
            <Label htmlFor="file-upload" className="flex items-center">
              <FileUpload
                onChange={setFiles}
                value={files}
                description="Carregue um PDF ou uma foto legível da sua conta de energia mais recente."
              />
            </Label>
          </div>
        </div>

        <div className="bg-trenergia-gray/50 p-2 md:p-3 rounded-lg flex items-start space-x-2">
          <Shield className="w-4 h-4 text-trenergia-blue mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-600">
            Suas informações serão tratadas com confidencialidade e utilizadas exclusivamente para a elaboração da proposta de economia na conta de energia.
          </p>
        </div>

        <Button
          type="submit"
          className={`w-full bg-trenergia-blue hover:bg-trenergia-blue/90 text-white font-medium ${isMobile ? 'py-4 text-sm' : 'py-6'}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processando...
            </span>
          ) : (
            "Receber Minha Proposta"
          )}
        </Button>
      </form>
    </div>
  );
}

export default LeadForm;
