export interface IProcessingChainProps {}
export interface IProcessingChain {
  uuid: string;
  cycle: string;
  props: IProcessingChainProps;
}

export interface IProcessingStepProps {}
export interface IProcessingStep {
  uuid: string;
  processingChainUuid: string;
  index: number;
  props: IProcessingStepProps;
  calculationSteps?: IProcessingStepCalculation[];
}

export interface IProcessingStepCalculationProps {}
export interface IProcessingStepCalculation {
  uuid: string;
  processingStepUuid: string;
  index: number;
  nodeDefUuid: string;
  props: IProcessingStepCalculationProps,
}
