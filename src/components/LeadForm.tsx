import * as React from 'react';
import { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { User, Mail, Phone, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
  consumo: z.string()
    .min(1, { message: "Por favor, informe o consumo" })
    .regex(/^\d+$/, { message: "O consumo deve conter apenas números" })
});

interface FormValues {
  name: string;
  email: string;
  phone: string;
  consumo: string;
}

export function LeadForm() {
  console.log('Ambiente:', import.meta.env.MODE);
  console.log('Webhook URL:', import.meta.env.VITE_WEBHOOK_URL);

  const { estabelecimento } = useParams();
  const estabelecimentoValido = estabelecimento && estabelecimentosValidos.includes(estabelecimento);

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
      consumo: ''
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value) {
          formData.append(key, value);
        }
      });

      formData.append('origem', estabelecimentoValido ? estabelecimento : 'deafult');
      formData.append('data_cadastro', new Date().toISOString());
      formData.append('submissionId', submissionId);
      formData.append('timestamp', new Date().toISOString());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
      console.log('Webhook URL:', webhookUrl);

      if (!webhookUrl) {
        console.error('URL do webhook não configurada');
        throw new Error('Configuração do webhook não encontrada. Por favor, verifique as variáveis de ambiente.');
      }

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

        if (response.status === 429) {
          throw new Error('Muitas tentativas. Por favor, aguarde um momento e tente novamente.');
        } else {
          throw new Error(`Erro ao enviar formulário: ${response.statusText}`);
        }
      }

      const contentType = response.headers.get('content-type');
      let result;

      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        result = await response.text();
      }

      console.log('Resposta do servidor:', result);

      if (response.ok) {
        toast.success('Formulário enviado com sucesso!');
        setIsSubmitted(true);
        form.reset();
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

  const handleConsumoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

          <div className="space-y-1 md:space-y-2">
            <Label htmlFor="consumo" className="flex items-center text-sm md:text-base">
              <Zap className="w-4 h-4 mr-2 text-trenergia-blue" />
              Valor da última fatura Neoenergia (R$)
            </Label>
            <Input
              id="consumo"
              type="text"
              placeholder="Digite apenas números"
              className="animated-input text-sm md:text-base h-9 md:h-10"
              {...form.register("consumo")}
              onChange={handleConsumoChange}
            />
            {form.formState.errors.consumo && (
              <p className="text-xs md:text-sm text-red-500 animate-slide-up">{form.formState.errors.consumo.message}</p>
            )}
            <p className="text-xs text-gray-500">
              Informe o valor em R$ da sua ultima.
            </p>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-trenergia-blue hover:bg-trenergia-lightblue text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Formulário'}
        </Button>
      </form>
    </div>
  );
}

export default LeadForm;
