import { InstancedInterleavedBuffer, InterleavedBufferAttribute } from 'three';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { ConditionalEdgesGeometry } from '../ConditionalEdgesGeometry';

export class ConditionalLineSegmentsGeometry extends LineSegmentsGeometry {

	fromConditionalEdgesGeometry( geometry: ConditionalEdgesGeometry ) {

		super.fromEdgesGeometry( geometry );

		const {
			direction,
			control0,
			control1,
		} = geometry.attributes;

		this.setAttribute( 'direction',
			new InterleavedBufferAttribute(
				new InstancedInterleavedBuffer( direction.array, 6, 1 ),
				3,
				0,
			),
		);

		this.setAttribute( 'control0',
			new InterleavedBufferAttribute(
				new InstancedInterleavedBuffer( control0.array, 6, 1 ),
				3,
				0,
			),
		);

		this.setAttribute( 'control1',
			new InterleavedBufferAttribute(
				new InstancedInterleavedBuffer( control1.array, 6, 1 ),
				3,
				0,
			),
		);

		return this;

	}

}
