import React from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessMessageProps {
  estabelecimento?: string;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ estabelecimento }) => {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-8">
      <div className="w-16 h-16 mb-4 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle className="h-10 w-10 text-trenergia-green" />
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Recebemos seus dados!
      </h2>

      <p className="text-gray-600 text-center mb-6 max-w-sm text-balance">
        Obrigado pelo seu interesse nas soluções da TR Energia. Nossa equipe entrará em contato em até 24 horas uteis com a proposta de economia na conta de energia.
      </p>

      <div className="bg-trenergia-gray p-4 rounded-lg max-w-sm">
        <p className="text-sm text-gray-600 flex items-start">
          <span className="text-trenergia-green mr-2">•</span>
          <span>
            <span className="font-medium">Próximos passos:</span> Elaboraremos a proposta de economia de energia para que você possa aproveitar o seu desconto exclusivo.
          </span>
        </p>
      </div>
    </div>
  );
};

export default SuccessMessage;
